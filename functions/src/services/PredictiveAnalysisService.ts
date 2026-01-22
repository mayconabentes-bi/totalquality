/**
 * PredictiveAnalysisService - Análise Preditiva de Documentos
 * 
 * Serviço que analisa documentos e sugere revisões baseadas em:
 * - Indicadores de falha em POPs de vídeo
 * - Histórico de não-conformidades
 * - Tempo desde última revisão
 * - Score de conformidade
 * 
 * Modo Axioma: Análise preditiva e sugestões automáticas
 */

import * as admin from 'firebase-admin';
import { Document, DocumentStatus } from '../types/document.types';

/**
 * Interface para análise de documento
 */
interface DocumentAnalysis {
  docId: string;
  titulo: string;
  status: DocumentStatus;
  needsRevision: boolean;
  riskLevel: 'alto' | 'médio' | 'baixo';
  reasons: string[];
  recommendations: string[];
  metrics: {
    daysSinceLastRevision: number;
    scoreConformidade?: number;
    naoConformidades?: number;
    custoManutencao: number;
  };
}

/**
 * Configuração de thresholds para análise preditiva
 */
interface AnalysisThresholds {
  daysUntilRevisionWarning: number;
  daysUntilRevisionRequired: number;
  minConformityScore: number;
  maxNonConformities: number;
}

/**
 * Serviço de análise preditiva
 */
export class PredictiveAnalysisService {
  private db: admin.firestore.Firestore;
  private thresholds: AnalysisThresholds;

  constructor(thresholds?: AnalysisThresholds) {
    this.db = admin.firestore();
    this.thresholds = thresholds || {
      daysUntilRevisionWarning: 90,
      daysUntilRevisionRequired: 180,
      minConformityScore: 70,
      maxNonConformities: 3,
    };
  }

  /**
   * Analisa um documento e retorna recomendações
   */
  async analyzeDocument(docId: string): Promise<DocumentAnalysis> {
    const docRef = this.db.collection('documents').doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error(`Documento ${docId} não encontrado`);
    }

    const document = docSnapshot.data() as Document;

    // Calcular dias desde última revisão
    const lastRevision = document.metadata.ultimaRevisao.toDate();
    const now = new Date();
    const daysSinceLastRevision = Math.floor(
      (now.getTime() - lastRevision.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Buscar dados de vídeo se existir
    let videoData = null;
    if (document.videoId && document.orgId) {
      const videoRef = this.db
        .collection('companies')
        .doc(document.orgId)
        .collection('pops')
        .doc(document.videoId);

      const videoSnapshot = await videoRef.get();
      if (videoSnapshot.exists) {
        videoData = videoSnapshot.data();
      }
    }

    // Extrair métricas
    const scoreConformidade = videoData?.popData?.scoreConformidade;
    const naoConformidades = videoData?.popData?.naoConformidades?.length || 0;

    // Avaliar necessidade de revisão
    const analysis = this.evaluateRevisionNeed(
      document,
      daysSinceLastRevision,
      scoreConformidade,
      naoConformidades
    );

    return {
      docId: document.docId,
      titulo: document.titulo,
      status: document.status,
      needsRevision: analysis.needsRevision,
      riskLevel: analysis.riskLevel,
      reasons: analysis.reasons,
      recommendations: analysis.recommendations,
      metrics: {
        daysSinceLastRevision,
        scoreConformidade,
        naoConformidades,
        custoManutencao: document.axiomaMetrics.custoManutencao,
      },
    };
  }

  /**
   * Avalia se um documento precisa de revisão
   */
  private evaluateRevisionNeed(
    document: Document,
    daysSinceLastRevision: number,
    scoreConformidade?: number,
    naoConformidades?: number
  ): {
    needsRevision: boolean;
    riskLevel: 'alto' | 'médio' | 'baixo';
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'alto' | 'médio' | 'baixo' = 'baixo';
    let needsRevision = false;

    // Verificar tempo desde última revisão
    if (daysSinceLastRevision >= this.thresholds.daysUntilRevisionRequired) {
      reasons.push(`Última revisão há ${daysSinceLastRevision} dias (>= ${this.thresholds.daysUntilRevisionRequired} dias)`);
      recommendations.push('Revisão obrigatória devido ao tempo decorrido');
      riskLevel = 'alto';
      needsRevision = true;
    } else if (daysSinceLastRevision >= this.thresholds.daysUntilRevisionWarning) {
      reasons.push(`Última revisão há ${daysSinceLastRevision} dias (próximo do limite)`);
      recommendations.push('Agendar revisão em breve');
      if (riskLevel === 'baixo') riskLevel = 'médio';
    }

    // Verificar score de conformidade
    if (scoreConformidade !== undefined && scoreConformidade < this.thresholds.minConformityScore) {
      reasons.push(`Score de conformidade baixo: ${scoreConformidade}% (< ${this.thresholds.minConformityScore}%)`);
      recommendations.push('Revisar procedimentos para aumentar conformidade');
      riskLevel = 'alto';
      needsRevision = true;
    }

    // Verificar não-conformidades
    if (naoConformidades !== undefined && naoConformidades > this.thresholds.maxNonConformities) {
      reasons.push(`Muitas não-conformidades: ${naoConformidades} (> ${this.thresholds.maxNonConformities})`);
      recommendations.push('Corrigir não-conformidades identificadas no vídeo');
      riskLevel = 'alto';
      needsRevision = true;
    }

    // Verificar impacto na margem
    if (document.axiomaMetrics.impactoMargem === 'alto') {
      reasons.push('Documento tem alto impacto na margem de lucro');
      recommendations.push('Priorizar revisão devido ao alto impacto financeiro');
      // Elevar risco apenas se ainda não for alto
      if (riskLevel !== 'alto') {
        riskLevel = 'alto';
      }
      needsRevision = true;
    }

    // Verificar status
    if (document.status === 'obsoleto') {
      reasons.push('Documento está obsoleto');
      recommendations.push('Criar nova versão ou arquivar permanentemente');
    }

    // Se não há razões, documento está em conformidade
    if (reasons.length === 0) {
      reasons.push('Documento em conformidade');
      recommendations.push('Manter monitoramento periódico');
    }

    return {
      needsRevision,
      riskLevel,
      reasons,
      recommendations,
    };
  }

  /**
   * Analisa todos os documentos de uma organização
   */
  async analyzeOrganization(orgId: string): Promise<DocumentAnalysis[]> {
    console.log(`📊 Analisando documentos da organização ${orgId}...`);

    const documentsSnapshot = await this.db
      .collection('documents')
      .where('orgId', '==', orgId)
      .where('status', 'in', ['ativo', 'revisao'])
      .get();

    console.log(`  Encontrados ${documentsSnapshot.size} documentos ativos/revisão`);

    const analyses: DocumentAnalysis[] = [];

    for (const doc of documentsSnapshot.docs) {
      try {
        const analysis = await this.analyzeDocument(doc.id);
        analyses.push(analysis);
      } catch (error) {
        console.error(`  ❌ Erro ao analisar ${doc.id}:`, error);
      }
    }

    // Ordenar por risco (alto -> médio -> baixo)
    analyses.sort((a, b) => {
      const riskOrder = { alto: 3, médio: 2, baixo: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });

    return analyses;
  }

  /**
   * Gera relatório de análise preditiva
   */
  async generateReport(orgId: string): Promise<void> {
    console.log('\n📋 RELATÓRIO DE ANÁLISE PREDITIVA\n');
    console.log('='.repeat(60));

    const analyses = await this.analyzeOrganization(orgId);

    const needsRevision = analyses.filter(a => a.needsRevision);
    const highRisk = analyses.filter(a => a.riskLevel === 'alto');
    const mediumRisk = analyses.filter(a => a.riskLevel === 'médio');
    const lowRisk = analyses.filter(a => a.riskLevel === 'baixo');

    console.log(`\n📊 RESUMO EXECUTIVO:`);
    console.log(`  Total de documentos analisados: ${analyses.length}`);
    console.log(`  Documentos que precisam revisão: ${needsRevision.length}`);
    console.log(`  Risco alto: ${highRisk.length}`);
    console.log(`  Risco médio: ${mediumRisk.length}`);
    console.log(`  Risco baixo: ${lowRisk.length}`);

    if (needsRevision.length > 0) {
      console.log(`\n⚠️ DOCUMENTOS QUE PRECISAM REVISÃO:\n`);

      needsRevision.forEach((analysis, index) => {
        console.log(`${index + 1}. ${analysis.titulo} (${analysis.docId})`);
        console.log(`   Risco: ${analysis.riskLevel.toUpperCase()}`);
        console.log(`   Status: ${analysis.status}`);
        console.log(`   Dias desde última revisão: ${analysis.metrics.daysSinceLastRevision}`);

        if (analysis.metrics.scoreConformidade) {
          console.log(`   Score conformidade: ${analysis.metrics.scoreConformidade}%`);
        }

        console.log(`   Razões:`);
        analysis.reasons.forEach(reason => {
          console.log(`     • ${reason}`);
        });

        console.log(`   Recomendações:`);
        analysis.recommendations.forEach(rec => {
          console.log(`     → ${rec}`);
        });

        console.log('');
      });
    } else {
      console.log('\n✅ Nenhum documento precisa revisão imediata.');
    }

    console.log('='.repeat(60));
  }
}
