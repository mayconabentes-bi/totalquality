/**
 * Tipos de Documentos para o Frontend
 * Sincronizados com os tipos do backend Firebase Functions
 */

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
  criadoPor: string;
  dataCriacao: Date | { seconds: number; nanoseconds: number };
  ultimaRevisao: Date | { seconds: number; nanoseconds: number };
}

/**
 * Métricas do Sistema Axioma para análise de impacto financeiro
 */
export interface AxiomaMetrics {
  custoManutencao: number;
  impactoMargem: ImpactoMargem;
}

/**
 * Interface principal do Documento
 */
export interface Document {
  docId: string;
  orgId: string;
  tipo: DocumentType;
  titulo: string;
  status: DocumentStatus;
  versao: string;
  contentHash: string;
  metadata: DocumentMetadata;
  axiomaMetrics: AxiomaMetrics;
}
