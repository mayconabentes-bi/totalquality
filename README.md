# TotalQuality

Sistema de Análise de Qualidade Empresarial com IA (Gemini 1.5 Pro)

## 🚀 Visão Geral

TotalQuality é uma plataforma multi-tenant que utiliza o Gemini 1.5 Pro para processar e analisar vídeos de qualidade empresarial, fornecendo insights sobre conformidade, métricas e recomendações de melhoria.

## 📋 Características

- **🔥 Firebase Firestore**: Banco de dados NoSQL multi-tenant com isolamento por empresa
- **⚡ Cloud Functions**: Processamento serverless de vídeos com Gemini 1.5 Pro
- **🌐 Firebase Hosting**: Dashboard de gestão moderno e responsivo
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

### 8. Deploy

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
├── functions/              # Cloud Functions (Gemini 1.5 Pro)
│   ├── index.js           # Função de processamento de vídeos
│   ├── package.json       # Dependências das functions
│   └── .eslintrc.js       # Configuração do ESLint
├── public/                # Dashboard de Gestão (Hosting)
│   └── index.html         # Interface do usuário
├── firebase.json          # Configuração principal do Firebase
├── .firebaserc            # Aliases de projetos
├── firestore.rules        # Regras de segurança do Firestore
├── firestore.indexes.json # Índices do Firestore
├── storage.rules          # Regras de segurança do Storage
└── .gitignore            # Arquivos ignorados pelo Git
```

## 🔒 Segurança Multi-Tenant

### Firestore Rules
- Cada empresa tem um documento único em `/companies/{companyId}`
- Usuários só podem acessar dados da própria empresa via `auth.token.companyId`
- Subcoleções: `videos/` e `analyses/`

### Storage Rules
- Vídeos armazenados em: `/companies/{companyId}/videos/`
- Vídeos processados em: `/companies/{companyId}/processed/`
- Limite de 500MB por vídeo
- Apenas vídeos são aceitos (`video/*`)

## 🎯 Uso

### Upload de Vídeo

Quando um vídeo é enviado para `gs://bucket/companies/{companyId}/videos/{filename}`:

1. Cloud Function `processVideoWithGemini` é acionada automaticamente
2. Gemini 1.5 Pro analisa o vídeo
3. Resultados são salvos em Firestore: `/companies/{companyId}/analyses/{videoId}`

### Análise Retornada

```json
{
  "videoPath": "companies/empresa123/videos/video.mp4",
  "analysis": "Resumo, problemas, métricas, recomendações, score",
  "processedAt": "2026-01-20T00:00:00.000Z",
  "status": "completed"
}
```

## 🧪 Desenvolvimento Local

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