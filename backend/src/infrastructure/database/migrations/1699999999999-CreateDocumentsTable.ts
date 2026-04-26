import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDocumentsTable1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la table existe déjà
    const tableExists = await queryRunner.hasTable('documents');

    if (!tableExists) {
      // Créer la table documents
      await queryRunner.createTable(
        new Table({
          name: 'documents',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'user_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'subscription_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'contract_id',
              type: 'integer',
              isNullable: true,
            },
            {
              name: 'folder_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'filename',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'r2_key',
              type: 'varchar',
              length: '500',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'r2_bucket',
              type: 'varchar',
              length: '100',
              isNullable: false,
              default: "'remindy-documents'",
            },
            {
              name: 'file_hash',
              type: 'varchar',
              length: '64',
              isNullable: false,
              comment: 'SHA-256 hash du fichier',
            },
            {
              name: 'file_size',
              type: 'bigint',
              isNullable: false,
            },
            {
              name: 'mime_type',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'ocr_text',
              type: 'text',
              isNullable: true,
              comment: 'Texte extrait par OCR',
            },
            {
              name: 'ocr_status',
              type: 'varchar',
              length: '20',
              isNullable: false,
              default: "'pending'",
              comment: 'pending, processing, completed, failed',
            },
            {
              name: 'ocr_error',
              type: 'text',
              isNullable: true,
              comment: "Message d'erreur OCR",
            },
            {
              name: 'uploaded_at',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'deleted_at',
              type: 'timestamptz',
              isNullable: true,
              comment: 'Soft delete timestamp',
            },
          ],
        }),
        true,
      );
    } else {
      console.log('Table documents already exists, skipping creation');
    }

    // Créer les index pour améliorer les performances
    const table = await queryRunner.getTable('documents');

    // Helpers — guard against partial schemas (e.g. when documents was
    // created by an earlier InitialSchema migration that uses different
    // column names like file_r2_key / created_at and lacks folder_id).
    const indexExists = (indexName: string): boolean => {
      return table?.indices.some(index => index.name === indexName) || false;
    };
    const columnExists = (columnName: string): boolean => {
      return table?.columns.some(col => col.name === columnName) || false;
    };
    const ensureIndex = async (
      indexName: string,
      columnNames: string[],
      isUnique = false,
    ): Promise<void> => {
      if (indexExists(indexName)) {
        console.log(`Index ${indexName} already exists, skipping`);
        return;
      }
      const missing = columnNames.filter(c => !columnExists(c));
      if (missing.length > 0) {
        console.log(
          `Skipping ${indexName}: documents.${missing.join(', ')} not present (legacy schema)`,
        );
        return;
      }
      await queryRunner.createIndex(
        'documents',
        new TableIndex({ name: indexName, columnNames, isUnique }),
      );
    };

    await ensureIndex('idx_documents_user_id', ['user_id']);
    await ensureIndex('idx_documents_subscription_id', ['subscription_id']);
    await ensureIndex('idx_documents_contract_id', ['contract_id']);
    await ensureIndex('idx_documents_folder_id', ['folder_id']);
    await ensureIndex('idx_documents_ocr_status', ['ocr_status']);
    await ensureIndex('idx_documents_r2_key', ['r2_key'], true);
    await ensureIndex('idx_documents_uploaded_at', ['uploaded_at']);

    // Créer les foreign keys (en supposant que les tables existent)
    // Note: Ajuster selon votre schéma existant
    const documentsTable = await queryRunner.getTable('documents');

    // Helper function to check if a foreign key exists
    const foreignKeyExists = (fkName: string): boolean => {
      return documentsTable?.foreignKeys.some(fk => fk.name === fkName) || false;
    };

    if (!foreignKeyExists('fk_documents_user')) {
      try {
        await queryRunner.createForeignKey(
          'documents',
          new TableForeignKey({
            name: 'fk_documents_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      } catch (error) {
        // Ignore si la table users n'existe pas encore
        console.warn('Could not create foreign key for users table:', error.message);
      }
    } else {
      console.log('Foreign key fk_documents_user already exists, skipping');
    }

    if (!foreignKeyExists('fk_documents_subscription')) {
      try {
        await queryRunner.createForeignKey(
          'documents',
          new TableForeignKey({
            name: 'fk_documents_subscription',
            columnNames: ['subscription_id'],
            referencedTableName: 'subscriptions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      } catch (error) {
        // Ignore si la table subscriptions n'existe pas encore
        console.warn('Could not create foreign key for subscriptions table:', error.message);
      }
    } else {
      console.log('Foreign key fk_documents_subscription already exists, skipping');
    }

    if (!foreignKeyExists('fk_documents_contract')) {
      try {
        await queryRunner.createForeignKey(
          'documents',
          new TableForeignKey({
            name: 'fk_documents_contract',
            columnNames: ['contract_id'],
            referencedTableName: 'contracts',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      } catch (error) {
        // Ignore si la table contracts n'existe pas encore
        console.warn('Could not create foreign key for contracts table:', error.message);
      }
    } else {
      console.log('Foreign key fk_documents_contract already exists, skipping');
    }

    if (!foreignKeyExists('fk_documents_folder')) {
      try {
        await queryRunner.createForeignKey(
          'documents',
          new TableForeignKey({
            name: 'fk_documents_folder',
            columnNames: ['folder_id'],
            referencedTableName: 'folders',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      } catch (error) {
        // Ignore si la table folders n'existe pas encore
        console.warn('Could not create foreign key for folders table:', error.message);
      }
    } else {
      console.log('Foreign key fk_documents_folder already exists, skipping');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les foreign keys
    const table = await queryRunner.getTable('documents');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('documents', foreignKey);
      }
    }

    // Supprimer les index
    await queryRunner.dropIndex('documents', 'idx_documents_user_id');
    await queryRunner.dropIndex('documents', 'idx_documents_subscription_id');
    await queryRunner.dropIndex('documents', 'idx_documents_contract_id');
    await queryRunner.dropIndex('documents', 'idx_documents_folder_id');
    await queryRunner.dropIndex('documents', 'idx_documents_ocr_status');
    await queryRunner.dropIndex('documents', 'idx_documents_r2_key');
    await queryRunner.dropIndex('documents', 'idx_documents_uploaded_at');

    // Supprimer la table
    await queryRunner.dropTable('documents');
  }
}
