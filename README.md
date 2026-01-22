# TotalQuality

Sistema de Gestão de Qualidade (SGQ) Empresarial com IA (Gemini 1.5 Pro)

## 🚀 Visão Geral

TotalQuality é uma plataforma multi-tenant completa de SGQ que supera o Qualiex, combinando:
- **Modo Standard**: Gestão documental clássica com fluxo de aprovação
- **Modo Axioma**: Inteligência artificial com Gemini 1.5 Pro para vídeo-auditoria e análise preditiva

Baseado nos **4 Cs**: **Conformidade**, **Claridade**, **Cultura** e **Conexão**

## 📋 Características

### Gestão Documental (Modo Standard)
- **📄 Documentos SGQ**: POPs, Manuais, Checklists e Políticas
- **🔄 Fluxo de Aprovação**: Workflow sequencial (Rascunho → Revisão → Ativo)
- **✅ Checklists ISO**: Templates para ISO 9001, 14001 e 45001
- **📊 Versionamento**: Controle semântico automático com histórico completo

### Inteligência Axioma (Modo IA)
- **🎥 Vídeo-Auditoria**: Extração automática de POPs usando Gemini 1.5 Pro
- **💰 Análise de Margem**: Vinculação custo/impacto em cada documento
- **🔮 Análise Preditiva**: Sugestões de revisão baseadas em indicadores de falha
- **🤖 Geração Automática**: POPs criados automaticamente a partir de vídeos

### Infraestrutura
- **🔥 Firebase Firestore**: Banco de dados NoSQL multi-tenant com isolamento por empresa
- **⚡ Cloud Functions**: Processamento serverless com TypeScript
- **🌐 Next.js + Tailwind**: Frontend moderno e responsivo
- **☁️ Cloud Storage**: Armazenamento seguro de vídeos com controle de acesso

## 🛠️ Setup do Ambiente de Desenvolvimento

### 1. Pré-requisitos

- Node.js 18 ou superior
- Conta Google/Firebase
- Git
- npm ou yarn

### 2. Instalação da Firebase CLI

```bash
# Instalar a CLI do Firebase globalmente
npm install -g firebase-tools

# Verificar instalação
firebase --version
```

### 3. Autenticação e Inicialização

```bash
# Login no Firebase
firebase login

# Clone o repositório (se ainda não fez)
git clone https://github.com/mayconabentes-bi/totalquality.git
cd totalquality
```

### 4. Configuração do Projeto Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com)
2. Crie um novo projeto ou use um existente
3. Anote o **Project ID**
4. Atualize o arquivo `.firebaserc` com seu Project ID:

```json
{
  "projects": {
    "default": "SEU-PROJECT-ID"
  }
}
```

### 5. Habilitar Serviços no Console Firebase

No Console do Firebase, habilite:

- ✅ **Firestore Database** (modo produção)
- ✅ **Cloud Functions** (plano Blaze necessário para APIs externas)
- ✅ **Cloud Storage** (rules personalizadas já configuradas)
- ✅ **Hosting** (para o dashboard)
- ✅ **Authentication** (opcional, para login de usuários)

### 6. Instalar Dependências das Functions

```bash
cd functions
npm install
cd ..
```

### 7. Configurar Gemini API Key

Obtenha sua API key em: https://makersuite.google.com/app/apikey

```bash
# Para Firebase Functions v2, usar secrets do Google Cloud Secret Manager
# Primeiro, crie o secret no Google Cloud Console ou via gcloud CLI
gcloud secrets create GEMINI_API_KEY --data-file=- <<< "SUA_GEMINI_API_KEY"

# Ou defina durante o deploy - o Firebase solicitará o valor
firebase deploy --only functions
# Quando solicitado, insira sua Gemini API key
```

### 8. Inicializar Sistema

Execute os comandos de contexto para configurar o sistema:

```bash
# Modo Standard: Estrutura de gestão documental clássica
node cli/index.js setup-standard

# Modo Axioma: IA e métricas de inteligência
node cli/index.js setup-axioma

# Verificar isolamento multi-tenant
node cli/index.js audit-check
```

### 9. Deploy

```bash
# Deploy completo (Firestore, Functions, Hosting, Storage)
firebase deploy

# Ou deploy individual:
firebase deploy --only firestore    # Apenas regras do Firestore
firebase deploy --only functions    # Apenas Cloud Functions
firebase deploy --only hosting      # Apenas site estático
firebase deploy --only storage      # Apenas regras do Storage
```

## 🏗️ Estrutura do Projeto

```
totalquality/
├── cli/                       # Comandos de contexto do sistema
│   ├── index.js              # setup-standard, setup-axioma, audit-check
│   └── dataCleanup.js        # Utilidades de limpeza de dados (Left Anti-Join)
├── functions/                 # Cloud Functions (Backend TypeScript)
│   ├── src/
│   │   ├── types/
│   │   │   └── document.types.ts          # Interfaces do sistema de documentos
│   │   └── services/
│   │       ├── DocumentService.ts         # CRUD e versionamento de documentos
│   │       ├── VideoPOPIntegrationService.ts  # Integração vídeo-documento
│   │       └── PredictiveAnalysisService.ts   # Análise preditiva
│   ├── index.js              # VideoProcessor (Gemini 1.5 Pro)
│   ├── package.json
│   └── tsconfig.json
├── webapp/                    # Frontend Next.js
│   ├── app/
│   │   ├── documentos/
│   │   │   └── page.tsx      # Dashboard de documentos
│   │   └── page.tsx          # Página inicial
│   ├── components/
│   │   └── DocumentCard.tsx  # Componente de card de documento
│   └── types/
│       └── document.ts       # Tipos frontend
├── firebase.json              # Configuração Firebase
├── firestore.rules           # Regras de segurança multi-tenant
├── firestore.indexes.json    # Índices do Firestore
└── storage.rules             # Regras de armazenamento
```

## 🎯 Comandos de Contexto

### Setup Standard (Modo Clássico)
Inicializa estrutura de gestão documental:

```bash
node cli/index.js setup-standard
```

**Cria:**
- Templates de checklist para ISO 9001, 14001 e 45001
- Configuração de fluxo de aprovação sequencial
- Estrutura de collections no Firestore

### Setup Axioma (Modo IA)
Implementa lógica de IA e métricas:

```bash
node cli/index.js setup-axioma
```

**Configura:**
- Processamento de vídeo com Gemini 1.5 Pro
- Thresholds de análise de margem (alto/médio/baixo)
- Análise preditiva com indicadores de falha
- Integração automática vídeo-documento

### Audit Check
Verifica isolamento multi-tenant:

```bash
node cli/index.js audit-check
```

**Valida:**
- Documentos possuem `orgId`
- Estrutura de subcoleções por empresa
- Regras de segurança do Firestore

## 🧹 Limpeza de Dados (Left Anti-Join)

### Remover Documentos Obsoletos

```bash
# Simulação (dry-run)
node cli/dataCleanup.js cleanup-obsolete 365

# Execução real - remove documentos obsoletos há mais de 365 dias
node cli/dataCleanup.js cleanup-obsolete 365 execute
```

### Remover POPs de Vídeo Órfãos

```bash
# Simulação
node cli/dataCleanup.js cleanup-pops

# Execução real
node cli/dataCleanup.js cleanup-pops execute
```

### Left Anti-Join Customizado

```bash
# Encontrar registros em CollectionA que não existem em CollectionB
node cli/dataCleanup.js left-anti-join documents companies orgId
```

## 🔒 Segurança Multi-Tenant

### Firestore Rules
- Cada documento possui `orgId` obrigatório
- Usuários só acessam dados da própria empresa via `auth.token.orgId`
- Subcoleções: `videos/`, `analyses/`, `history/`

### Storage Rules
- Vídeos em: `/companies/{companyId}/videos/`
- Vídeos processados: `/companies/{companyId}/processed/`
- Limite: 500MB por vídeo
- Apenas vídeos (`video/*`)

## 🎯 Uso do Sistema

### 1. Criação de Documentos

```typescript
import { DocumentService } from './services/DocumentService';

const service = new DocumentService();

const doc = await service.createDocument({
  orgId: 'org-001',
  tipo: 'POP',
  titulo: 'Procedimento de Limpeza',
  contentHash: 'abc123',
  criadoPor: 'user-123',
  custoManutencao: 500,
  impactoMargem: 'médio'
});
```

### 2. Aprovação de Documentos

```typescript
const approved = await service.approveDocument(
  doc.docId,
  'manager-456',
  'Aprovado após revisão técnica'
);
// Versão incrementada: 0.1 → 1.0
```

### 3. Upload de Vídeo para Análise

Faça upload para Cloud Storage:
```
gs://bucket/companies/{companyId}/videos/procedimento.mp4
```

**VideoProcessor** automaticamente:
1. Detecta o upload
2. Processa com Gemini 1.5 Pro
3. Extrai POP estruturado
4. Salva em Firestore: `/companies/{companyId}/pops/{videoId}`

### 4. Integração Vídeo-Documento

```typescript
import { VideoPOPIntegrationService } from './services/VideoPOPIntegrationService';

const integration = new VideoPOPIntegrationService();

// Criar documento a partir de vídeo POP
const doc = await integration.createDocumentFromVideoPOP(
  'company-123',
  'video-456',
  'user-789'
);

// Processar todos os POPs não vinculados
const processed = await integration.autoProcessUnlinkedPOPs('company-123');
```

### 5. Análise Preditiva

```typescript
import { PredictiveAnalysisService } from './services/PredictiveAnalysisService';

const analysis = new PredictiveAnalysisService();

// Analisar documento específico
const docAnalysis = await analysis.analyzeDocument('doc-123');

// Gerar relatório completo da organização
await analysis.generateReport('org-001');
```

**Saída do Relatório:**
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
   Razões:
     • Score de conformidade baixo: 65% (< 70%)
     • Muitas não-conformidades: 5 (> 3)
   Recomendações:
     → Revisar procedimentos para aumentar conformidade
     → Corrigir não-conformidades identificadas no vídeo
```

## 📊 Dashboard Web


Acesse o dashboard em: `http://localhost:3000/documentos`

**Funcionalidades:**
- Visualização de documentos com status colorido
- Estatísticas por status (Ativo, Revisão, Rascunho, Obsoleto)
- Indicadores do Sistema Axioma (custo e impacto na margem)
- Grid responsivo com Tailwind CSS

## 🧪 Desenvolvimento Local

### Webapp (Frontend)

```bash
cd webapp
npm install
npm run dev
```

Acesse: `http://localhost:3000`

### Emuladores Firebase

```bash
# Iniciar emuladores do Firebase
firebase emulators:start

# Emuladores disponíveis:
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
# - Hosting: http://localhost:5000
# - Storage: http://localhost:9199
```

## 📊 Monitoramento

```bash
# Ver logs das Functions
firebase functions:log

# Ver logs de uma função específica
firebase functions:log --only processVideoWithGemini
```

## 🤝 GitHub Copilot Pro

Este repositório está configurado para trabalhar com GitHub Copilot Pro:

- Copilot atua como executor de código
- Gemini 1.5 Pro como arquiteto da lógica de negócios
- Integração contínua via GitHub Actions (configurar conforme necessário)

## 📝 Licença

Ver arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique a documentação do Firebase: https://firebase.google.com/docs
2. Consulte a documentação do Gemini: https://ai.google.dev/docs
3. Abra uma issue neste repositório