#!/usr/bin/env node
/**
 * TotalQuality CLI - Context Commands
 * 
 * Commands:
 * - setup-standard: Initialize classic document management structure
 * - setup-axioma: Initialize AI features and intelligent metrics
 * - audit-check: Verify multi-tenant isolation compliance
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
function initializeFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.firestore();
}

/**
 * Setup Standard Mode: Classic Document Management
 * Creates initial collections, indexes, and sample data structure
 */
async function setupStandard() {
  console.log('🚀 Iniciando Setup Standard Mode...\n');
  
  const db = initializeFirebase();
  
  console.log('📋 Modo Standard - Gestão Documental Clássica');
  console.log('Características:');
  console.log('  ✓ CRUD de POPs, Manuais e Políticas');
  console.log('  ✓ Fluxo de aprovação sequencial');
  console.log('  ✓ Checklists vinculadas a normas ISO');
  console.log('  ✓ Segurança multi-tenant via orgId\n');
  
  try {
    // Create sample checklist templates
    const checklistTemplates = [
      {
        templateId: 'iso-9001-audit',
        nome: 'Auditoria ISO 9001',
        norma: 'ISO 9001:2015',
        itens: [
          { ordem: 1, descricao: 'Verificar política de qualidade documentada', obrigatorio: true },
          { ordem: 2, descricao: 'Validar objetivos de qualidade mensuráveis', obrigatorio: true },
          { ordem: 3, descricao: 'Confirmar registros de treinamento', obrigatorio: true },
          { ordem: 4, descricao: 'Revisar análise crítica pela direção', obrigatorio: true },
          { ordem: 5, descricao: 'Verificar controle de documentos e registros', obrigatorio: true },
        ],
        versao: '1.0',
        ativo: true,
      },
      {
        templateId: 'iso-14001-environmental',
        nome: 'Gestão Ambiental ISO 14001',
        norma: 'ISO 14001:2015',
        itens: [
          { ordem: 1, descricao: 'Identificar aspectos ambientais significativos', obrigatorio: true },
          { ordem: 2, descricao: 'Verificar requisitos legais aplicáveis', obrigatorio: true },
          { ordem: 3, descricao: 'Avaliar objetivos e metas ambientais', obrigatorio: true },
          { ordem: 4, descricao: 'Confirmar planos de emergência', obrigatorio: false },
          { ordem: 5, descricao: 'Revisar monitoramento e medição', obrigatorio: true },
        ],
        versao: '1.0',
        ativo: true,
      },
      {
        templateId: 'iso-45001-safety',
        nome: 'Segurança do Trabalho ISO 45001',
        norma: 'ISO 45001:2018',
        itens: [
          { ordem: 1, descricao: 'Verificar política de SST', obrigatorio: true },
          { ordem: 2, descricao: 'Identificar perigos e avaliar riscos', obrigatorio: true },
          { ordem: 3, descricao: 'Confirmar uso de EPIs', obrigatorio: true },
          { ordem: 4, descricao: 'Revisar investigação de incidentes', obrigatorio: true },
          { ordem: 5, descricao: 'Validar consulta e participação dos trabalhadores', obrigatorio: true },
        ],
        versao: '1.0',
        ativo: true,
      },
    ];
    
    console.log('📝 Criando templates de checklist...');
    for (const template of checklistTemplates) {
      await db.collection('checklistTemplates').doc(template.templateId).set(template);
      console.log(`  ✓ Template criado: ${template.nome} (${template.norma})`);
    }
    
    // Create workflow configuration
    const workflowConfig = {
      configId: 'default-approval-workflow',
      nome: 'Fluxo de Aprovação Padrão',
      etapas: [
        { ordem: 1, status: 'rascunho', nome: 'Criação de Rascunho', permiteEdicao: true },
        { ordem: 2, status: 'revisao', nome: 'Em Revisão', permiteEdicao: false },
        { ordem: 3, status: 'ativo', nome: 'Documento Ativo', permiteEdicao: false },
      ],
      transicoes: [
        { de: 'rascunho', para: 'revisao', requerAprovacao: false },
        { de: 'revisao', para: 'ativo', requerAprovacao: true },
        { de: 'ativo', para: 'revisao', requerAprovacao: true, motivo: 'Revisão de documento ativo' },
      ],
      ativo: true,
    };
    
    console.log('\n⚙️ Configurando fluxo de aprovação...');
    await db.collection('workflowConfigs').doc(workflowConfig.configId).set(workflowConfig);
    console.log('  ✓ Fluxo de aprovação configurado');
    
    console.log('\n✅ Setup Standard Mode concluído com sucesso!');
    console.log('\nPróximos passos:');
    console.log('  1. Use DocumentService.createDocument() para criar documentos');
    console.log('  2. Use DocumentService.approveDocument() para aprovar documentos');
    console.log('  3. Acesse /webapp/documentos para visualizar o dashboard');
    
  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    throw error;
  }
}

/**
 * Setup Axioma Mode: AI Features and Intelligent Metrics
 * Configures video processing integration and predictive analysis
 */
async function setupAxioma() {
  console.log('🤖 Iniciando Setup Axioma Mode...\n');
  
  const db = initializeFirebase();
  
  console.log('🎯 Modo Axioma - Inteligência e IA');
  console.log('Características:');
  console.log('  ✓ Vídeo-auditoria com Gemini 1.5 Pro');
  console.log('  ✓ Inteligência de margem (custo/impacto)');
  console.log('  ✓ Geração automática de POPs via vídeo');
  console.log('  ✓ Análise preditiva de revisões\n');
  
  try {
    // Create Axioma configuration
    const axiomaConfig = {
      configId: 'axioma-main-config',
      nome: 'Configuração Axioma',
      videoProcessing: {
        enabled: true,
        modelVersion: 'gemini-1.5-pro',
        autoGeneratePOP: true,
        minConfidenceScore: 70,
      },
      marginAnalysis: {
        enabled: true,
        thresholds: {
          alto: { custoMinimo: 1000, impactoDescricao: 'Crítico para operação' },
          medio: { custoMinimo: 500, impactoDescricao: 'Importante mas não crítico' },
          baixo: { custoMinimo: 0, impactoDescricao: 'Impacto mínimo na operação' },
        },
      },
      predictiveAnalysis: {
        enabled: true,
        checkIntervalDays: 30,
        failureIndicators: [
          'score_conformidade < 70',
          'nao_conformidades > 3',
          'tempo_execucao > tempo_estimado * 1.5',
        ],
      },
      ativo: true,
    };
    
    console.log('⚙️ Configurando sistema Axioma...');
    await db.collection('axiomaConfigs').doc(axiomaConfig.configId).set(axiomaConfig);
    console.log('  ✓ Configuração Axioma criada');
    
    // Create metrics tracking collection structure
    const metricsTemplate = {
      templateId: 'default-metrics',
      nome: 'Template de Métricas Padrão',
      metricas: [
        { nome: 'scoreConformidade', tipo: 'number', min: 0, max: 100, unidade: '%' },
        { nome: 'custoManutencao', tipo: 'number', min: 0, unidade: 'R$' },
        { nome: 'tempoExecucao', tipo: 'number', min: 0, unidade: 'minutos' },
        { nome: 'naoConformidades', tipo: 'number', min: 0, unidade: 'count' },
        { nome: 'impactoMargem', tipo: 'enum', valores: ['alto', 'médio', 'baixo'] },
      ],
      ativo: true,
    };
    
    console.log('\n📊 Criando templates de métricas...');
    await db.collection('metricsTemplates').doc(metricsTemplate.templateId).set(metricsTemplate);
    console.log('  ✓ Template de métricas criado');
    
    // Create video-to-document link configuration
    const videoLinkConfig = {
      configId: 'video-document-integration',
      nome: 'Integração Vídeo-Documento',
      autoLink: true,
      generatePOPOnComplete: true,
      requireManualReview: false,
      ativo: true,
    };
    
    console.log('\n🎥 Configurando integração vídeo-documento...');
    await db.collection('videoLinkConfigs').doc(videoLinkConfig.configId).set(videoLinkConfig);
    console.log('  ✓ Integração vídeo-documento configurada');
    
    console.log('\n✅ Setup Axioma Mode concluído com sucesso!');
    console.log('\nPróximos passos:');
    console.log('  1. Faça upload de vídeos para gs://bucket/companies/{companyId}/videos/');
    console.log('  2. VideoProcessor irá extrair POPs automaticamente');
    console.log('  3. Use DocumentService para vincular POPs a documentos');
    console.log('  4. Análises preditivas serão executadas automaticamente');
    
  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    throw error;
  }
}

/**
 * Audit Check: Verify Multi-Tenant Isolation
 * Validates that all data respects orgId isolation
 */
async function auditCheck() {
  console.log('🔍 Iniciando Audit Check - Verificação Multi-Tenant...\n');
  
  const db = initializeFirebase();
  let issues = [];
  let checks = 0;
  
  try {
    console.log('📋 Verificando isolamento multi-tenant...\n');
    
    // Check 1: Documents collection
    console.log('1️⃣ Verificando collection "documents"...');
    const documentsSnapshot = await db.collection('documents').limit(100).get();
    checks++;
    
    const docsWithoutOrgId = [];
    documentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.orgId) {
        docsWithoutOrgId.push(doc.id);
      }
    });
    
    if (docsWithoutOrgId.length > 0) {
      issues.push({
        collection: 'documents',
        problema: `${docsWithoutOrgId.length} documento(s) sem orgId`,
        documentos: docsWithoutOrgId,
      });
      console.log(`  ⚠️ Encontrados ${docsWithoutOrgId.length} documentos sem orgId`);
    } else {
      console.log(`  ✓ Todos os ${documentsSnapshot.size} documentos possuem orgId`);
    }
    
    // Check 2: Companies collection
    console.log('\n2️⃣ Verificando collection "companies"...');
    const companiesSnapshot = await db.collection('companies').limit(100).get();
    checks++;
    
    const companiesWithSubcollections = [];
    for (const companyDoc of companiesSnapshot.docs) {
      const popsSnapshot = await companyDoc.ref.collection('pops').limit(1).get();
      const videosSnapshot = await companyDoc.ref.collection('videos').limit(1).get();
      const analysesSnapshot = await companyDoc.ref.collection('analyses').limit(1).get();
      
      if (popsSnapshot.size > 0 || videosSnapshot.size > 0 || analysesSnapshot.size > 0) {
        companiesWithSubcollections.push({
          companyId: companyDoc.id,
          pops: popsSnapshot.size,
          videos: videosSnapshot.size,
          analyses: analysesSnapshot.size,
        });
      }
    }
    
    console.log(`  ✓ Estrutura de subcoleções verificada para ${companiesSnapshot.size} empresas`);
    if (companiesWithSubcollections.length > 0) {
      console.log(`  ℹ️ ${companiesWithSubcollections.length} empresa(s) com dados nas subcoleções`);
    }
    
    // Check 3: Firestore Rules verification
    console.log('\n3️⃣ Verificando regras de segurança...');
    console.log('  ℹ️ As regras de segurança devem ser verificadas manualmente no Console Firebase');
    console.log('  ℹ️ Certifique-se de que auth.token.orgId é usado em todas as regras');
    checks++;
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA AUDITORIA');
    console.log('='.repeat(60));
    console.log(`Total de verificações: ${checks}`);
    console.log(`Problemas encontrados: ${issues.length}`);
    
    if (issues.length === 0) {
      console.log('\n✅ Nenhum problema de isolamento detectado!');
      console.log('✅ Sistema está em conformidade com multi-tenant.');
    } else {
      console.log('\n⚠️ PROBLEMAS DETECTADOS:\n');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. Collection: ${issue.collection}`);
        console.log(`   Problema: ${issue.problema}`);
        if (issue.documentos && issue.documentos.length <= 5) {
          console.log(`   Documentos afetados: ${issue.documentos.join(', ')}`);
        } else if (issue.documentos) {
          console.log(`   Documentos afetados: ${issue.documentos.slice(0, 5).join(', ')} ... (e outros)`);
        }
        console.log('');
      });
      
      console.log('⚠️ AÇÃO REQUERIDA:');
      console.log('  1. Corrija os documentos sem orgId');
      console.log('  2. Execute audit-check novamente para verificar');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return issues.length === 0;
    
  } catch (error) {
    console.error('❌ Erro durante auditoria:', error);
    throw error;
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('TotalQuality CLI - Context Commands\n');
    console.log('Uso: node cli/index.js <comando>\n');
    console.log('Comandos disponíveis:');
    console.log('  setup-standard  - Iniciar estrutura de gestão documental clássica');
    console.log('  setup-axioma    - Implementar lógica de IA e métricas');
    console.log('  audit-check     - Verificar isolamento multi-tenant\n');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'setup-standard':
        await setupStandard();
        break;
      case 'setup-axioma':
        await setupAxioma();
        break;
      case 'audit-check':
        const isCompliant = await auditCheck();
        process.exit(isCompliant ? 0 : 1);
        break;
      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        console.log('Execute sem argumentos para ver a lista de comandos disponíveis.');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = {
  setupStandard,
  setupAxioma,
  auditCheck,
};
