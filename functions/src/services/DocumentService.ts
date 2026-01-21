/**
 * DocumentService - Serviço de Gestão de Documentos com Versionamento
 * 
 * Implementa operações CRUD para o Módulo de Gestão de Documentação
 * seguindo as normas de SGQ e o Sistema Axioma de inteligência de margem.
 * 
 * Características:
 * - Multi-tenant com isolamento por orgId
 * - Versionamento semântico de documentos
 * - Histórico completo de versões
 * - Conformidade com normas de qualidade
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  DocumentHistory,
  CreateDocumentInput,
  DocumentStatus,
} from '../types/document.types';

/**
 * Serviço de gerenciamento de documentos
 */
export class DocumentService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Cria um novo documento com status 'rascunho'
   * 
   * @param input - Dados de entrada para criação do documento
   * @returns Documento criado
   */
  async createDocument(input: CreateDocumentInput): Promise<Document> {
    const docId = uuidv4();
    const now = admin.firestore.Timestamp.now();

    const document: Document = {
      docId,
      orgId: input.orgId,
      tipo: input.tipo,
      titulo: input.titulo,
      status: 'rascunho',
      versao: '0.1',
      contentHash: input.contentHash,
      metadata: {
        criadoPor: input.criadoPor,
        dataCriacao: now,
        ultimaRevisao: now,
      },
      axiomaMetrics: {
        custoManutencao: input.custoManutencao || 0,
        impactoMargem: input.impactoMargem || 'baixo',
      },
    };

    // Salvar documento no Firestore
    await this.db
      .collection('documents')
      .doc(docId)
      .set(document);

    return document;
  }

  /**
   * Aprova um documento, mudando status para 'ativo' e incrementando versão
   * Arquiva a versão anterior na subcoleção 'history'
   * 
   * @param docId - ID do documento a ser aprovado
   * @param aprovadoPor - ID do usuário aprovador
   * @param motivoMudanca - Motivo da aprovação/mudança (opcional)
   * @returns Documento aprovado com nova versão
   */
  async approveDocument(
    docId: string,
    aprovadoPor: string,
    motivoMudanca?: string
  ): Promise<Document> {
    const docRef = this.db.collection('documents').doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error(`Documento ${docId} não encontrado`);
    }

    const currentDoc = docSnapshot.data() as Document;

    // Validar se documento pode ser aprovado
    if (currentDoc.status === 'obsoleto') {
      throw new Error('Não é possível aprovar um documento obsoleto');
    }

    // Incrementar versão (0.1 -> 1.0, 1.0 -> 2.0)
    const newVersion = this.incrementVersion(currentDoc.versao);
    const now = admin.firestore.Timestamp.now();

    // Arquivar versão anterior se já foi ativo
    if (currentDoc.status === 'ativo') {
      const historyEntry: DocumentHistory = {
        docId: currentDoc.docId,
        versao: currentDoc.versao,
        documentSnapshot: currentDoc,
        arquivadoEm: now,
        aprovadoPor,
        motivoMudanca,
      };

      await docRef
        .collection('history')
        .doc(currentDoc.versao)
        .set(historyEntry);
    }

    // Atualizar documento para status ativo
    const updatedDoc: Document = {
      ...currentDoc,
      status: 'ativo',
      versao: newVersion,
      metadata: {
        ...currentDoc.metadata,
        ultimaRevisao: now,
      },
    };

    await docRef.update(updatedDoc as any);

    return updatedDoc;
  }

  /**
   * Marca um documento como obsoleto conforme normas de conformidade
   * Documentos obsoletos são mantidos para auditoria mas não são mais usados
   * 
   * @param docId - ID do documento
   * @param motivoObsolescencia - Motivo da obsolescência
   * @returns Documento marcado como obsoleto
   */
  async obsoleteDocument(
    docId: string,
    motivoObsolescencia?: string
  ): Promise<Document> {
    const docRef = this.db.collection('documents').doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error(`Documento ${docId} não encontrado`);
    }

    const currentDoc = docSnapshot.data() as Document;
    const now = admin.firestore.Timestamp.now();

    // Arquivar estado atual antes de tornar obsoleto
    const historyEntry: DocumentHistory = {
      docId: currentDoc.docId,
      versao: currentDoc.versao,
      documentSnapshot: currentDoc,
      arquivadoEm: now,
      aprovadoPor: 'SYSTEM',
      motivoMudanca: motivoObsolescencia || 'Documento marcado como obsoleto',
    };

    await docRef
      .collection('history')
      .doc(`obsoleto-${currentDoc.versao}`)
      .set(historyEntry);

    // Atualizar documento para status obsoleto
    const updatedDoc: Document = {
      ...currentDoc,
      status: 'obsoleto',
      metadata: {
        ...currentDoc.metadata,
        ultimaRevisao: now,
      },
    };

    await docRef.update(updatedDoc as any);

    return updatedDoc;
  }

  /**
   * Recupera todos os documentos de uma organização
   * Garante isolamento multi-tenant por orgId
   * 
   * @param orgId - ID da organização
   * @param status - Filtro opcional por status
   * @returns Lista de documentos da organização
   */
  async getDocumentsByOrg(
    orgId: string,
    status?: DocumentStatus
  ): Promise<Document[]> {
    let query = this.db
      .collection('documents')
      .where('orgId', '==', orgId);

    // Aplicar filtro de status se fornecido
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const documents: Document[] = [];

    snapshot.forEach((doc) => {
      documents.push(doc.data() as Document);
    });

    return documents;
  }

  /**
   * Recupera o histórico de versões de um documento
   * 
   * @param docId - ID do documento
   * @returns Lista de versões históricas ordenadas por data
   */
  async getDocumentHistory(docId: string): Promise<DocumentHistory[]> {
    const historySnapshot = await this.db
      .collection('documents')
      .doc(docId)
      .collection('history')
      .orderBy('arquivadoEm', 'desc')
      .get();

    const history: DocumentHistory[] = [];
    historySnapshot.forEach((doc) => {
      history.push(doc.data() as DocumentHistory);
    });

    return history;
  }

  /**
   * Incrementa a versão do documento seguindo semver simplificado
   * 
   * @param currentVersion - Versão atual (ex: '0.1', '1.0', '2.3')
   * @returns Nova versão incrementada
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0], 10);

    // Se versão é 0.x (rascunho), vai para 1.0
    if (major === 0) {
      return '1.0';
    }

    // Caso contrário, incrementa major
    return `${major + 1}.0`;
  }
}
