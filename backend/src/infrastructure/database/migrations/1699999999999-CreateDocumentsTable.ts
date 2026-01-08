import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateDocumentsTable1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Créer les index pour améliorer les performances
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_subscription_id',
        columnNames: ['subscription_id'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_contract_id',
        columnNames: ['contract_id'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_folder_id',
        columnNames: ['folder_id'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_ocr_status',
        columnNames: ['ocr_status'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_r2_key',
        columnNames: ['r2_key'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'idx_documents_uploaded_at',
        columnNames: ['uploaded_at'],
      }),
    );

    // Créer les foreign keys (en supposant que les tables existent)
    // Note: Ajuster selon votre schéma existant
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
