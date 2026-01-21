/**
 * Tipos de Documentos do SGQ (Sistema de Gestão de Qualidade)
 * Seguindo os 4 Cs: Conformidade, Claridade, Cultura e Conexão
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Tipos de documentos suportados pelo sistema
 */
export type DocumentType = 'POP' | 'Manual' | 'Checklist' | 'Politica';

/**
 * Status do ciclo de vida do documento
 */
export type DocumentStatus = 'rascunho' | 'revisao' | 'ativo' | 'obsoleto';

/**
 * Nível de impacto do documento na margem de lucro (Sistema Axioma)
 */
export type ImpactoMargem = 'alto' | 'medio' | 'baixo';

/**
 * Metadados de criação e revisão do documento
 */
export interface DocumentMetadata {
  /** ID do usuário que criou o documento */
  criadoPor: string;
  /** Data e hora de criação do documento */
  dataCriacao: Timestamp;
  /** Data e hora da última revisão */
  ultimaRevisao: Timestamp;
}

/**
 * Métricas do Sistema Axioma para análise de impacto financeiro
 */
export interface AxiomaMetrics {
  /** Custo estimado de manutenção do documento (em R$) */
  custoManutencao: number;
  /** Nível de impacto na margem de lucro */
  impactoMargem: ImpactoMargem;
}

/**
 * Interface principal do Documento
 * Representa um documento de gestão de qualidade no Firestore
 */
export interface Document {
  /** Identificador único do documento (UUID) */
  docId: string;
  
  /** ID da organização para isolamento lógico multi-tenant */
  orgId: string;
  
  /** Tipo do documento (POP, Manual, Checklist, Política) */
  tipo: DocumentType;
  
  /** Título descritivo do documento */
  titulo: string;
  
  /** Status atual do documento no ciclo de vida */
  status: DocumentStatus;
  
  /** Versão do documento (formato semântico: '1.0', '1.1', '2.0') */
  versao: string;
  
  /** Hash do conteúdo para garantir integridade do arquivo */
  contentHash: string;
  
  /** Metadados de criação e revisão */
  metadata: DocumentMetadata;
  
  /** Métricas do Sistema Axioma para inteligência de margem */
  axiomaMetrics: AxiomaMetrics;
}

/**
 * Interface para entrada de criação de documento
 * Campos opcionais serão preenchidos automaticamente
 */
export interface CreateDocumentInput {
  orgId: string;
  tipo: DocumentType;
  titulo: string;
  contentHash: string;
  criadoPor: string;
  custoManutencao?: number;
  impactoMargem?: ImpactoMargem;
}

/**
 * Interface para histórico de versões do documento
 * Armazenado na subcoleção 'history' de cada documento
 */
export interface DocumentHistory {
  /** ID da versão anterior */
  docId: string;
  
  /** Versão anterior arquivada */
  versao: string;
  
  /** Snapshot completo do documento na versão anterior */
  documentSnapshot: Document;
  
  /** Data e hora do arquivamento */
  arquivadoEm: Timestamp;
  
  /** Usuário que aprovou a nova versão */
  aprovadoPor: string;
  
  /** Motivo da mudança de versão */
  motivoMudanca?: string;
}
