import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CreateFoldersAndRelations1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer la table folders
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
            comment: 'ID de l\'utilisateur propriétaire',
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

    // 2. Ajouter les index sur folders
    await queryRunner.query(`
      CREATE INDEX idx_folders_user_id ON folders(user_id);
      CREATE INDEX idx_folders_parent_id ON folders(parent_id);
      CREATE INDEX idx_folders_name ON folders(name);
      CREATE INDEX idx_folders_deleted_at ON folders(deleted_at);
    `);

    // 3. Ajouter la foreign key pour parent_id (auto-référence)
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

    // 4. Ajouter la colonne folder_id à documents
    await queryRunner.addColumn(
      'documents',
      new TableColumn({
        name: 'folder_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID du dossier contenant ce document',
      }),
    );

    // 5. Créer l'index sur folder_id
    await queryRunner.query(`
      CREATE INDEX idx_documents_folder_id ON documents(folder_id);
    `);

    // 6. Ajouter la foreign key entre documents et folders
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
