/**
 * VideoPOPIntegrationService - Integração entre POPs de Vídeo e Documentos
 * 
 * Serviço que vincula POPs extraídos de vídeos (via Gemini 1.5 Pro)
 * com o sistema de documentos, criando documentos automaticamente
 * a partir das análises de vídeo.
 * 
 * Modo Axioma: Atuação cirúrgica e automatizada
 */

import * as admin from 'firebase-admin';
import { DocumentService } from './DocumentService';
import { CreateDocumentInput } from '../types/document.types';

/**
 * Interface para dados de POP extraídos de vídeo
 */
interface VideoPOPData {
  videoPath: string;
  videoUri: string;
  popData: {
    titulo?: string;
    objetivo?: string;
    etapas?: Array<{
      numero: number;
      descricao: string;
      tempo?: string;
      ferramentas?: string[];
      pontosC riticos?: string[];
    }>;
    requisitosSeguranca?: string[];
    materiaisFerramentas?: string[];
    tempoEstimado?: string;
    responsavel?: string;
    criteriosQualidade?: string[];
    naoConformidades?: string[];
    scoreConformidade?: number;
  };
  extractedAt: admin.firestore.Timestamp;
  status: string;
}

/**
 * Serviço de integração entre vídeos e documentos
 */
export class VideoPOPIntegrationService {
  private db: admin.firestore.Firestore;
  private documentService: DocumentService;

  constructor() {
    this.db = admin.firestore();
    this.documentService = new DocumentService();
  }

  /**
   * Cria um documento POP automaticamente a partir de um vídeo processado
   * 
   * @param companyId - ID da empresa (orgId)
   * @param videoId - ID do vídeo processado
   * @param criadoPor - ID do usuário (pode ser 'SYSTEM' para automático)
   * @returns Documento criado
   */
  async createDocumentFromVideoPOP(
    companyId: string,
    videoId: string,
    criadoPor: string = 'SYSTEM'
  ) {
    try {
      // Buscar dados do POP do vídeo
      const popRef = this.db
        .collection('companies')
        .doc(companyId)
        .collection('pops')
        .doc(videoId);

      const popSnapshot = await popRef.get();

      if (!popSnapshot.exists) {
        throw new Error(`POP de vídeo ${videoId} não encontrado para empresa ${companyId}`);
      }

      const popData = popSnapshot.data() as VideoPOPData;

      if (popData.status !== 'completed') {
        throw new Error(`POP de vídeo ${videoId} não está completo (status: ${popData.status})`);
      }

      // Extrair informações do POP
      const titulo = popData.popData.titulo || `POP Extraído de Vídeo ${videoId}`;
      const scoreConformidade = popData.popData.scoreConformidade || 0;
      const naoConformidades = popData.popData.naoConformidades?.length || 0;

      // Calcular custo de manutenção baseado em complexidade
      const etapas = popData.popData.etapas?.length || 0;
      const custoManutencao = this.calculateMaintenanceCost(etapas, naoConformidades);

      // Determinar impacto na margem baseado em score e não-conformidades
      const impactoMargem = this.calculateMarginImpact(scoreConformidade, naoConformidades);

      // Gerar hash do conteúdo (simplificado)
      const contentHash = this.generateContentHash(popData);

      // Criar documento usando DocumentService
      const documentInput: CreateDocumentInput = {
        orgId: companyId,
        tipo: 'POP',
        titulo,
        contentHash,
        criadoPor,
        custoManutencao,
        impactoMargem,
      };

      const document = await this.documentService.createDocument(documentInput);

      // Vincular documento ao vídeo
      await this.linkDocumentToVideo(companyId, videoId, document.docId);

      console.log(`✓ Documento ${document.docId} criado a partir do vídeo ${videoId}`);

      return document;
    } catch (error) {
      console.error('Erro ao criar documento de vídeo POP:', error);
      throw error;
    }
  }

  /**
   * Vincula um documento existente a um vídeo POP
   */
  private async linkDocumentToVideo(
    companyId: string,
    videoId: string,
    docId: string
  ): Promise<void> {
    const popRef = this.db
      .collection('companies')
      .doc(companyId)
      .collection('pops')
      .doc(videoId);

    await popRef.update({
      linkedDocumentId: docId,
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Também adicionar referência no documento
    const docRef = this.db.collection('documents').doc(docId);
    await docRef.update({
      videoId,
      videoPath: (await popRef.get()).data()?.videoPath,
    });
  }

  /**
   * Calcula custo de manutenção baseado na complexidade do procedimento
   */
  private calculateMaintenanceCost(etapas: number, naoConformidades: number): number {
    // Custo base por etapa: R$ 50
    const baseCost = etapas * 50;

    // Custo adicional por não-conformidade: R$ 200
    const nonConformityCost = naoConformidades * 200;

    return baseCost + nonConformityCost;
  }

  /**
   * Determina impacto na margem baseado em score e não-conformidades
   */
  private calculateMarginImpact(
    scoreConformidade: number,
    naoConformidades: number
  ): 'alto' | 'médio' | 'baixo' {
    // Score baixo ou muitas não-conformidades = alto impacto
    if (scoreConformidade < 70 || naoConformidades > 3) {
      return 'alto';
    }

    // Score médio ou poucas não-conformidades = médio impacto
    if (scoreConformidade < 85 || naoConformidades > 1) {
      return 'médio';
    }

    // Score alto e sem não-conformidades = baixo impacto
    return 'baixo';
  }

  /**
   * Gera hash simplificado do conteúdo do POP
   */
  private generateContentHash(popData: VideoPOPData): string {
    const content = JSON.stringify(popData.popData);
    // Usar timestamp + primeiros caracteres como hash simplificado
    return `${Date.now()}-${content.substring(0, 10)}`.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Busca POPs de vídeo não vinculados a documentos
   */
  async findUnlinkedVideoPOPs(companyId: string): Promise<string[]> {
    const popsSnapshot = await this.db
      .collection('companies')
      .doc(companyId)
      .collection('pops')
      .where('status', '==', 'completed')
      .where('linkedDocumentId', '==', null)
      .get();

    const unlinkedPOPs: string[] = [];
    popsSnapshot.forEach(doc => {
      unlinkedPOPs.push(doc.id);
    });

    return unlinkedPOPs;
  }

  /**
   * Processa automaticamente todos os POPs não vinculados de uma empresa
   */
  async autoProcessUnlinkedPOPs(companyId: string): Promise<number> {
    console.log(`🤖 Processamento automático de POPs não vinculados para ${companyId}...`);

    const unlinkedPOPs = await this.findUnlinkedVideoPOPs(companyId);
    console.log(`  Encontrados ${unlinkedPOPs.length} POPs não vinculados`);

    let processed = 0;
    for (const videoId of unlinkedPOPs) {
      try {
        await this.createDocumentFromVideoPOP(companyId, videoId, 'AUTO-SYSTEM');
        processed++;
        console.log(`  ✓ POP ${videoId} processado`);
      } catch (error) {
        console.error(`  ❌ Erro ao processar POP ${videoId}:`, error);
      }
    }

    console.log(`✅ Total processado: ${processed}/${unlinkedPOPs.length}`);
    return processed;
  }
}
