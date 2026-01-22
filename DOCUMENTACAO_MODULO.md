# Módulo de Gestão de Documentação - TotalQuality

## 📋 Visão Geral

Este módulo implementa um sistema completo de gestão de documentação para o SGQ (Sistema de Gestão de Qualidade) baseado nos **4 Cs**: Conformidade, Claridade, Cultura e Conexão.

O sistema é **multi-tenant** com isolamento total de dados por organização e integrado com o **Sistema Axioma** para análise de impacto na margem de lucro.

## 🏗️ Arquitetura

### Backend (Firebase Functions)

#### 1. Definição de Tipos (`functions/src/types/document.types.ts`)

Interfaces TypeScript que definem a estrutura dos documentos:

- **DocumentType**: 'POP' | 'Manual' | 'Checklist' | 'Politica'
- **DocumentStatus**: 'rascunho' | 'revisao' | 'ativo' | 'obsoleto'
- **ImpactoMargem**: 'alto' | 'medio' | 'baixo'
- **Document**: Interface principal com todos os campos obrigatórios

**Campos Obrigatórios:**
```typescript
{
  docId: string           // UUID único
  orgId: string          // ID da organização (isolamento)
  tipo: DocumentType     // Tipo do documento
  titulo: string         // Título descritivo
  status: DocumentStatus // Status no ciclo de vida
  versao: string         // Versão semântica (ex: '1.0')
  contentHash: string    // Hash para integridade
  metadata: {
    criadoPor: string
    dataCriacao: Timestamp
    ultimaRevisao: Timestamp
  }
  axiomaMetrics: {
    custoManutencao: number
    impactoMargem: ImpactoMargem
  }
}
```

#### 2. Serviço de Gestão (`functions/src/services/DocumentService.ts`)

Classe TypeScript com operações CRUD e versionamento:

##### `createDocument(input: CreateDocumentInput): Promise<Document>`
- Cria novo documento com status 'rascunho'
- Versão inicial: '0.1'
- Gera UUID automaticamente

##### `approveDocument(docId: string, aprovadoPor: string): Promise<Document>`
- Altera status para 'ativo'
- Incrementa versão (0.1 → 1.0, 1.0 → 2.0)
- Arquiva versão anterior em subcoleção `history`

##### `obsoleteDocument(docId: string, motivo?: string): Promise<Document>`
- Marca documento como 'obsoleto'
- Mantém para auditoria conforme normas de conformidade
- Arquiva estado atual no histórico

##### `getDocumentsByOrg(orgId: string, status?: DocumentStatus): Promise<Document[]>`
- Recupera documentos com filtro por organização
- Garante isolamento multi-tenant
- Filtro opcional por status

##### `getDocumentHistory(docId: string): Promise<DocumentHistory[]>`
- Recupera histórico completo de versões
- Ordenado por data de arquivamento

### Regras de Segurança (`firestore.rules`)

Isolamento total por `orgId` usando `auth.token.orgId`:

```javascript
match /documents/{docId} {
  // Apenas usuários da mesma organização
  allow read: if request.auth.token.orgId == resource.data.orgId;
  allow create: if request.auth.token.orgId == request.resource.data.orgId;
  allow update: if request.auth.token.orgId == resource.data.orgId;
  allow delete: if request.auth.token.orgId == resource.data.orgId;
  
  // Histórico com mesmas regras
  match /history/{versionId} {
    allow read, write: if <mesma orgId>;
  }
}
```

### Frontend (Next.js/React)

#### Componente DocumentCard (`webapp/components/DocumentCard.tsx`)

Componente React com Tailwind CSS que exibe:

**Características Visuais:**
- ✅ Status colorido diferenciado:
  - 🟢 **Ativo**: Verde (conformidade)
  - 🟡 **Em Revisão**: Amarelo (atenção)
  - ⚪ **Rascunho**: Cinza (trabalho em progresso)
  - 🔴 **Obsoleto**: Vermelho + badge animado "⚠️ OBSOLETO"

- 📊 **Sistema Axioma**:
  - Badge de impacto (Alto ⬆️, Médio ➡️, Baixo ⬇️)
  - Custo de manutenção em R$
  - Cores diferenciadas por nível de impacto

- 📝 **Metadados**:
  - Tipo de documento
  - Versão atual
  - Criador e data de última revisão

**Props:**
```typescript
interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
}
```

#### Página de Demonstração (`webapp/app/documentos/page.tsx`)

- Dashboard completo com 5 documentos de exemplo
- Estatísticas por status
- Grid responsivo (1 coluna mobile → 3 colunas desktop)
- Informações técnicas do sistema

## 🚀 Como Usar

### Compilar TypeScript

```bash
cd functions
npm install
npm run build
```

### Executar Webapp Localmente

```bash
cd webapp
npm install
npm run dev
```

Acesse: `http://localhost:3000/documentos`

### Deploy Firebase

```bash
# Deploy completo
firebase deploy

# Apenas Firestore rules
firebase deploy --only firestore

# Apenas Functions
firebase deploy --only functions
```

## 📂 Estrutura de Arquivos

```
totalquality/
├── functions/
│   ├── src/
│   │   ├── types/
│   │   │   └── document.types.ts      # Interfaces TypeScript
│   │   └── services/
│   │       └── DocumentService.ts     # CRUD com versionamento
│   ├── tsconfig.json                  # Configuração TypeScript
│   └── package.json                   # Dependências + scripts
├── webapp/
│   ├── app/
│   │   └── documentos/
│   │       └── page.tsx               # Página de demonstração
│   ├── components/
│   │   └── DocumentCard.tsx           # Componente de UI
│   └── types/
│       └── document.ts                # Tipos para frontend
└── firestore.rules                    # Regras de segurança
```

## 🔒 Segurança Multi-Tenant

1. **Isolamento por orgId**: Cada documento pertence a uma organização
2. **Validação no Token**: Auth token deve conter `orgId`
3. **Regras Firestore**: Bloqueiam acesso cross-organization
4. **Versionamento Auditável**: Histórico completo para conformidade

## 📊 Sistema Axioma

Métricas de inteligência de margem integradas em cada documento:

- **custoManutencao**: Custo estimado em R$
- **impactoMargem**: Nível de impacto (alto/médio/baixo)

Permite análise financeira e priorização de documentos críticos.

## 🎯 Conformidade SGQ - 4 Cs

1. **Conformidade**: Versionamento, histórico e regras de segurança
2. **Claridade**: Interface intuitiva com status visual claro
3. **Cultura**: Metadados de criação e responsabilidade
4. **Conexão**: Multi-tenant para múltiplas organizações

## 🧪 Exemplo de Uso (JavaScript/TypeScript)

```typescript
import { DocumentService } from './services/DocumentService';

const service = new DocumentService();

// Criar documento
const doc = await service.createDocument({
  orgId: 'org-001',
  tipo: 'POP',
  titulo: 'Procedimento de Limpeza',
  contentHash: 'abc123',
  criadoPor: 'user-123',
  custoManutencao: 500,
  impactoMargem: 'medio'
});

// Aprovar documento
const approved = await service.approveDocument(
  doc.docId,
  'manager-456',
  'Aprovado após revisão técnica'
);

// Listar documentos da organização
const docs = await service.getDocumentsByOrg('org-001', 'ativo');

// Marcar como obsoleto
const obsolete = await service.obsoleteDocument(
  doc.docId,
  'Substituído pela versão 2.0'
);
```

## 📸 Screenshot

![Módulo de Gestão de Documentação](https://github.com/user-attachments/assets/71994072-3f28-4d25-96b4-c98e2382781d)

## 🤝 Contribuindo

Este módulo segue as melhores práticas de:
- TypeScript strict mode
- Isolamento multi-tenant
- Versionamento semântico
- Auditoria completa
- UI/UX com Tailwind CSS

## 📄 Licença

Ver arquivo [LICENSE](../LICENSE) para detalhes.
