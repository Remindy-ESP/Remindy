import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CreateFoldersAndRelations1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer la table folders si elle n'existe pas
    const foldersTableExists = await queryRunner.hasTable('folders');

    if (!foldersTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'folders',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'user_id',
              type: 'uuid',
              isNullable: false,
              comment: "ID de l'utilisateur propriétaire",
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
              isNullable: false,
              comment: 'Nom du dossier',
            },
            {
              name: 'parent_id',
              type: 'uuid',
              isNullable: true,
              comment: 'ID du dossier parent (pour sous-dossiers)',
            },
            {
              name: 'color',
              type: 'varchar',
              length: '7',
              isNullable: true,
              comment: 'Couleur du dossier (hex)',
            },
            {
              name: 'icon',
              type: 'varchar',
              length: '50',
              isNullable: true,
              comment: 'Icône du dossier',
            },
            {
              name: 'is_default',
              type: 'boolean',
              default: false,
              comment: 'Si le dossier est créé automatiquement',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
              comment: 'Soft delete',
            },
          ],
        }),
        true,
      );
      console.log('Created folders table');
    } else {
      console.log('Folders table already exists, skipping creation');
    }

    // 2. Ajouter les index sur folders
    const foldersTable = await queryRunner.getTable('folders');
    const foldersIndexNames = [
      'idx_folders_user_id',
      'idx_folders_parent_id',
      'idx_folders_name',
      'idx_folders_deleted_at',
    ];

    for (const indexName of foldersIndexNames) {
      const indexExists = foldersTable?.indices.some(index => index.name === indexName);
      if (!indexExists) {
        if (indexName === 'idx_folders_user_id') {
          await queryRunner.query(`CREATE INDEX idx_folders_user_id ON folders(user_id)`);
        } else if (indexName === 'idx_folders_parent_id') {
          await queryRunner.query(`CREATE INDEX idx_folders_parent_id ON folders(parent_id)`);
        } else if (indexName === 'idx_folders_name') {
          await queryRunner.query(`CREATE INDEX idx_folders_name ON folders(name)`);
        } else if (indexName === 'idx_folders_deleted_at') {
          await queryRunner.query(`CREATE INDEX idx_folders_deleted_at ON folders(deleted_at)`);
        }
        console.log(`Created index ${indexName}`);
      } else {
        console.log(`Index ${indexName} already exists, skipping`);
      }
    }

    // 3. Ajouter la foreign key pour parent_id (auto-référence)
    const foldersTableUpdated = await queryRunner.getTable('folders');
    const parentFkExists = foldersTableUpdated?.foreignKeys.some(
      fk => fk.name === 'fk_folders_parent',
    );

    if (!parentFkExists) {
      await queryRunner.createForeignKey(
        'folders',
        new TableForeignKey({
          columnNames: ['parent_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'folders',
          onDelete: 'SET NULL',
          name: 'fk_folders_parent',
        }),
      );
      console.log('Created foreign key fk_folders_parent');
    } else {
      console.log('Foreign key fk_folders_parent already exists, skipping');
    }

    // 4. Ajouter la colonne folder_id à documents si elle n'existe pas
    const hasFolderIdColumn = await queryRunner.hasColumn('documents', 'folder_id');

    if (!hasFolderIdColumn) {
      await queryRunner.addColumn(
        'documents',
        new TableColumn({
          name: 'folder_id',
          type: 'uuid',
          isNullable: true,
          comment: 'ID du dossier contenant ce document',
        }),
      );
      console.log('Added folder_id column to documents');
    } else {
      console.log('Column folder_id already exists in documents, skipping');
    }

    // 5. Créer l'index sur folder_id
    const documentsTable = await queryRunner.getTable('documents');
    const folderIdIndexExists = documentsTable?.indices.some(
      index => index.name === 'idx_documents_folder_id',
    );

    if (!folderIdIndexExists) {
      await queryRunner.query(`CREATE INDEX idx_documents_folder_id ON documents(folder_id)`);
      console.log('Created index idx_documents_folder_id');
    } else {
      console.log('Index idx_documents_folder_id already exists, skipping');
    }

    // 6. Ajouter la foreign key entre documents et folders
    const documentsTableUpdated = await queryRunner.getTable('documents');
    const documentsFolderFkExists = documentsTableUpdated?.foreignKeys.some(
      fk => fk.name === 'fk_documents_folder',
    );

    if (!documentsFolderFkExists) {
      await queryRunner.createForeignKey(
        'documents',
        new TableForeignKey({
          columnNames: ['folder_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'folders',
          onDelete: 'SET NULL',
          name: 'fk_documents_folder',
        }),
      );
      console.log('Created foreign key fk_documents_folder');
    } else {
      console.log('Foreign key fk_documents_folder already exists, skipping');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer la foreign key de documents
    await queryRunner.dropForeignKey('documents', 'fk_documents_folder');

    // 2. Supprimer l'index et la colonne folder_id de documents
    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_folder_id;`);
    await queryRunner.dropColumn('documents', 'folder_id');

    // 3. Supprimer la foreign key parent_id de folders
    await queryRunner.dropForeignKey('folders', 'fk_folders_parent');

    // 4. Supprimer les index de folders
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_folders_user_id;
      DROP INDEX IF EXISTS idx_folders_parent_id;
      DROP INDEX IF EXISTS idx_folders_name;
      DROP INDEX IF EXISTS idx_folders_deleted_at;
    `);

    // 5. Supprimer la table folders
    await queryRunner.dropTable('folders');
  }
}
