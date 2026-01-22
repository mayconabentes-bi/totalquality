# Guia de Uso - TotalQuality

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Primeiros Passos](#primeiros-passos)
3. [Modo Standard](#modo-standard)
4. [Modo Axioma](#modo-axioma)
5. [Comandos CLI](#comandos-cli)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Solução de Problemas](#solução-de-problemas)

## Visão Geral

TotalQuality é um Sistema de Gestão de Qualidade (SGQ) completo que opera em dois modos complementares:

- **Modo Standard**: Gestão documental clássica para substituir o Qualiex
- **Modo Axioma**: Inteligência artificial com análise preditiva e vídeo-auditoria

### Os 4 Cs

Todo o sistema é baseado em quatro princípios fundamentais:

1. **Conformidade**: Versionamento rigoroso e histórico auditável
2. **Claridade**: Interface intuitiva com status visual imediato
3. **Cultura**: Fomentar responsabilidade e engajamento
4. **Conexão**: Isolamento multi-tenant absoluto via orgId

## Primeiros Passos

### 1. Configuração Inicial

```bash
# Instalar dependências
cd functions && npm install
cd ../webapp && npm install

# Configurar Firebase
firebase login
firebase use <seu-project-id>
```

### 2. Inicializar Modo Standard

```bash
# Criar templates de checklist e workflow
node cli/index.js setup-standard
```

**O que é criado:**
- 3 templates de checklist (ISO 9001, 14001, 45001)
- Configuração de fluxo de aprovação
- Collections no Firestore

### 3. Inicializar Modo Axioma

```bash
# Configurar IA e análise preditiva
node cli/index.js setup-axioma
```

**O que é configurado:**
- Processamento de vídeo com Gemini 1.5 Pro
- Thresholds de análise de margem
- Análise preditiva automática
- Integração vídeo-documento

### 4. Verificar Segurança

```bash
# Auditar isolamento multi-tenant
node cli/index.js audit-check
```

## Modo Standard

### Criação de Documentos

#### Via DocumentService (Backend)

```typescript
import { DocumentService } from './functions/src/services/DocumentService';

const service = new DocumentService();

// Criar novo POP
const pop = await service.createDocument({
  orgId: 'minha-empresa-001',
  tipo: 'POP',
  titulo: 'Procedimento de Higienização de Equipamentos',
  contentHash: 'hash-do-conteudo-original',
  criadoPor: 'joao.silva@empresa.com',
  custoManutencao: 850.00,
  impactoMargem: 'médio'
});

console.log(`POP criado: ${pop.docId}`);
console.log(`Status: ${pop.status}`);  // 'rascunho'
console.log(`Versão: ${pop.versao}`);  // '0.1'
```

### Fluxo de Aprovação

```typescript
// 1. Enviar para revisão (rascunho -> revisao)
// Isso pode ser feito atualizando o status diretamente

// 2. Aprovar documento (revisao -> ativo)
const aprovado = await service.approveDocument(
  pop.docId,
  'maria.santos@empresa.com',
  'Revisão técnica aprovada'
);

console.log(`Versão após aprovação: ${aprovado.versao}`);  // '1.0'
console.log(`Status: ${aprovado.status}`);  // 'ativo'
```

### Listar Documentos por Status

```typescript
// Listar todos documentos ativos
const documentosAtivos = await service.getDocumentsByOrg(
  'minha-empresa-001',
  'ativo'
);

console.log(`Total de documentos ativos: ${documentosAtivos.length}`);

documentosAtivos.forEach(doc => {
  console.log(`- ${doc.titulo} (v${doc.versao})`);
});
```

### Marcar como Obsoleto

```typescript
// Tornar documento obsoleto
const obsoleto = await service.obsoleteDocument(
  pop.docId,
  'Substituído pela versão 2.0 do processo'
);

console.log(`Documento marcado como obsoleto`);
// O histórico é preservado automaticamente
```

### Histórico de Versões

```typescript
// Ver histórico completo de um documento
const historico = await service.getDocumentHistory(pop.docId);

console.log(`Histórico de versões:`);
historico.forEach(version => {
  console.log(`- v${version.versao}: ${version.motivoMudanca || 'N/A'}`);
  console.log(`  Aprovado por: ${version.aprovadoPor}`);
  console.log(`  Data: ${version.arquivadoEm.toDate()}`);
});
```

## Modo Axioma

### Upload e Processamento de Vídeo

#### 1. Upload para Cloud Storage

Faça upload de vídeos para a estrutura correta:

```
gs://<seu-bucket>/companies/<companyId>/videos/procedimento-limpeza.mp4
```

Via gsutil:
```bash
gsutil cp procedimento-limpeza.mp4 gs://seu-bucket/companies/empresa-001/videos/
```

#### 2. Processamento Automático

O `VideoProcessor` detecta automaticamente e:
1. Processa o vídeo com Gemini 1.5 Pro
2. Extrai POP estruturado
3. Salva em Firestore: `/companies/{companyId}/pops/{videoId}`

**Estrutura do POP extraído:**
```json
{
  "titulo": "Procedimento de Limpeza",
  "objetivo": "Garantir higienização adequada...",
  "etapas": [
    {
      "numero": 1,
      "descricao": "Preparar solução de limpeza",
      "ferramentas": ["Balde", "Pano"],
      "pontosCriticos": ["Usar EPI apropriado"]
    }
  ],
  "scoreConformidade": 85,
  "naoConformidades": ["EPI não utilizado na etapa 3"]
}
```

### Integração Vídeo-Documento

#### Criar Documento Automaticamente

```typescript
import { VideoPOPIntegrationService } from './functions/src/services/VideoPOPIntegrationService';

const integration = new VideoPOPIntegrationService();

// Criar documento a partir de vídeo POP processado
const documento = await integration.createDocumentFromVideoPOP(
  'empresa-001',
  'video-123',
  'sistema-automatico'
);

console.log(`Documento criado: ${documento.titulo}`);
console.log(`Custo de manutenção: R$ ${documento.axiomaMetrics.custoManutencao}`);
console.log(`Impacto na margem: ${documento.axiomaMetrics.impactoMargem}`);
```

#### Processar Todos os POPs Não Vinculados

```typescript
// Vincular automaticamente todos os vídeos processados
const processados = await integration.autoProcessUnlinkedPOPs('empresa-001');

console.log(`${processados} POPs vinculados a documentos`);
```

### Análise Preditiva

#### Analisar Documento Específico

```typescript
import { PredictiveAnalysisService } from './functions/src/services/PredictiveAnalysisService';

const analysis = new PredictiveAnalysisService();

// Analisar um documento
const resultado = await analysis.analyzeDocument('doc-123');

console.log(`Documento: ${resultado.titulo}`);
console.log(`Precisa revisão: ${resultado.needsRevision ? 'SIM' : 'NÃO'}`);
console.log(`Nível de risco: ${resultado.riskLevel}`);

console.log('\nRazões:');
resultado.reasons.forEach(reason => console.log(`  - ${reason}`));

console.log('\nRecomendações:');
resultado.recommendations.forEach(rec => console.log(`  → ${rec}`));
```

#### Relatório da Organização

```typescript
// Gerar relatório completo
await analysis.generateReport('empresa-001');
```

**Exemplo de Saída:**

```
📋 RELATÓRIO DE ANÁLISE PREDITIVA
================================================================

📊 RESUMO EXECUTIVO:
  Total de documentos analisados: 25
  Documentos que precisam revisão: 5
  Risco alto: 2
  Risco médio: 3
  Risco baixo: 20

⚠️ DOCUMENTOS QUE PRECISAM REVISÃO:

1. Procedimento de Higienização (doc-001)
   Risco: ALTO
   Status: ativo
   Dias desde última revisão: 245
   Score conformidade: 65%
   
   Razões:
     • Última revisão há 245 dias (>= 180 dias)
     • Score de conformidade baixo: 65% (< 70%)
     • Muitas não-conformidades: 5 (> 3)
     • Documento tem alto impacto na margem de lucro
   
   Recomendações:
     → Revisão obrigatória devido ao tempo decorrido
     → Revisar procedimentos para aumentar conformidade
     → Corrigir não-conformidades identificadas no vídeo
     → Priorizar revisão devido ao alto impacto financeiro
```

### Configuração de Thresholds

```typescript
// Customizar thresholds de análise
const customAnalysis = new PredictiveAnalysisService({
  daysUntilRevisionWarning: 60,      // Aviso após 60 dias
  daysUntilRevisionRequired: 120,    // Obrigatório após 120 dias
  minConformityScore: 75,            // Score mínimo: 75%
  maxNonConformities: 2              // Máximo de 2 não-conformidades
});
```

## Comandos CLI

### setup-standard

Inicializa estrutura de gestão documental clássica.

```bash
node cli/index.js setup-standard
```

**Cria:**
- Templates de checklist para ISO 9001, 14001, 45001
- Configuração de workflow de aprovação
- Collections base no Firestore

### setup-axioma

Implementa lógica de IA e métricas de rentabilidade.

```bash
node cli/index.js setup-axioma
```

**Configura:**
- Sistema de vídeo-auditoria
- Thresholds de margem (alto/médio/baixo)
- Análise preditiva
- Templates de métricas

### audit-check

Verifica isolamento multi-tenant e conformidade de segurança.

```bash
node cli/index.js audit-check
```

**Valida:**
- Todos documentos possuem orgId
- Estrutura de subcoleções por empresa
- Regras de segurança do Firestore

**Saída de exemplo:**
```
🔍 Iniciando Audit Check - Verificação Multi-Tenant...

1️⃣ Verificando collection "documents"...
  ✓ Todos os 25 documentos possuem orgId

2️⃣ Verificando collection "companies"...
  ✓ Estrutura de subcoleções verificada para 3 empresas

3️⃣ Verificando regras de segurança...
  ℹ️ Certifique-se de que auth.token.orgId é usado em todas as regras

================================================================
📊 RESUMO DA AUDITORIA
================================================================
Total de verificações: 3
Problemas encontrados: 0

✅ Nenhum problema de isolamento detectado!
✅ Sistema está em conformidade com multi-tenant.
```

### Data Cleanup (dataCleanup.js)

#### Remover Documentos Obsoletos

```bash
# Simulação (dry-run)
node cli/dataCleanup.js cleanup-obsolete 365

# Execução real
node cli/dataCleanup.js cleanup-obsolete 365 execute
```

Remove documentos obsoletos há mais de X dias.

#### Remover POPs Órfãos

```bash
# Simulação
node cli/dataCleanup.js cleanup-pops

# Execução real
node cli/dataCleanup.js cleanup-pops execute
```

Remove POPs de vídeo que não estão vinculados a documentos.

#### Left Anti-Join Customizado

```bash
# Encontrar documentos sem empresa correspondente
node cli/dataCleanup.js left-anti-join documents companies orgId
```

## Exemplos Práticos

### Exemplo 1: Criar e Aprovar POP

```typescript
// 1. Criar rascunho
const doc = await service.createDocument({
  orgId: 'empresa-001',
  tipo: 'POP',
  titulo: 'Calibração de Instrumentos',
  contentHash: 'abc123',
  criadoPor: 'tecnico@empresa.com',
  custoManutencao: 600,
  impactoMargem: 'alto'
});

// 2. Aprovar
const aprovado = await service.approveDocument(
  doc.docId,
  'gerente@empresa.com',
  'Procedimento validado pela equipe'
);
```

### Exemplo 2: Processar Vídeo e Criar Documento

```typescript
// 1. Upload de vídeo (via gsutil ou Console)
// gs://bucket/companies/empresa-001/videos/calibracao.mp4

// 2. Aguardar processamento automático (VideoProcessor)

// 3. Criar documento a partir do POP extraído
const integration = new VideoPOPIntegrationService();
const doc = await integration.createDocumentFromVideoPOP(
  'empresa-001',
  'calibracao',  // ID do vídeo
  'sistema'
);
```

### Exemplo 3: Análise Preditiva Completa

```typescript
// 1. Analisar organização
const analysis = new PredictiveAnalysisService();
const analises = await analysis.analyzeOrganization('empresa-001');

// 2. Filtrar documentos de alto risco
const altoRisco = analises.filter(a => a.riskLevel === 'alto');

// 3. Processar documentos que precisam revisão
for (const analise of altoRisco) {
  if (analise.needsRevision) {
    console.log(`⚠️ ${analise.titulo} precisa revisão URGENTE`);
    // Enviar notificação, criar task, etc.
  }
}
```

## Solução de Problemas

### Erro: "Documento sem orgId"

**Problema:** Documento criado sem orgId.

**Solução:**
```bash
node cli/index.js audit-check
# Identificar documentos problemáticos
# Corrigir manualmente ou via script
```

### Erro: "POP de vídeo não encontrado"

**Problema:** Tentando criar documento de vídeo que não foi processado.

**Solução:**
1. Verificar se vídeo existe em Storage
2. Verificar logs do VideoProcessor
3. Reprocessar vídeo se necessário

### Erro: "Firebase Admin not initialized"

**Problema:** Firebase Admin SDK não inicializado.

**Solução:**
```typescript
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
```

### Performance: Muitos Documentos

**Problema:** Listagem lenta com muitos documentos.

**Solução:**
```typescript
// Usar paginação
const documentos = await db.collection('documents')
  .where('orgId', '==', orgId)
  .limit(50)
  .get();
```

### Limpeza de Dados

**Problema:** Muitos documentos obsoletos antigos.

**Solução:**
```bash
# Simular primeiro
node cli/dataCleanup.js cleanup-obsolete 365

# Executar limpeza
node cli/dataCleanup.js cleanup-obsolete 365 execute
```

## Suporte

Para problemas ou dúvidas:
1. Verificar este guia de uso
2. Consultar README.md principal
3. Consultar DOCUMENTACAO_MODULO.md
4. Abrir issue no repositório

---

**TotalQuality** - Sistema de Gestão de Qualidade Superior ao Qualiex
