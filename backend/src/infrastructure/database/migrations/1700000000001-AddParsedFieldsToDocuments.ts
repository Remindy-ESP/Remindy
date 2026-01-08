import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddParsedFieldsToDocuments1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('documents');

    // Helper function to check if a column exists
    const columnExists = (columnName: string): boolean => {
      return table?.columns.some(column => column.name === columnName) || false;
    };

    // Ajouter les colonnes pour les données parsées par Gemini
    const columnsToAdd: TableColumn[] = [];

    if (!columnExists('parsed_provider')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_provider',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Nom du fournisseur/service extrait par Gemini',
      }));
    }

    if (!columnExists('parsed_amount')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Montant de l\'abonnement extrait',
      }));
    }

    if (!columnExists('parsed_currency')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_currency',
        type: 'varchar',
        length: '3',
        isNullable: true,
        default: "'EUR'",
        comment: 'Devise (EUR, USD, etc.)',
      }));
    }

    if (!columnExists('parsed_date')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_date',
        type: 'date',
        isNullable: true,
        comment: 'Date de début ou d\'échéance',
      }));
    }

    if (!columnExists('parsed_frequency')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_frequency',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Fréquence: mensuel, trimestriel, annuel, ponctuel',
      }));
    }

    if (!columnExists('parsed_category')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsed_category',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Catégorie: énergie, internet, assurance, SaaS, etc.',
      }));
    }

    if (!columnExists('parsing_confidence')) {
      columnsToAdd.push(new TableColumn({
        name: 'parsing_confidence',
        type: 'float',
        isNullable: true,
        comment: 'Score de confiance du parsing (0-1)',
      }));
    }

    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('documents', columnsToAdd);
      console.log(`Added ${columnsToAdd.length} column(s) to documents table`);
    } else {
      console.log('All columns already exist, skipping column creation');
    }

    // Créer des index pour améliorer les performances de recherche
    // Check if indexes exist before creating them
    const indexNames = ['idx_documents_parsed_provider', 'idx_documents_parsed_category', 'idx_documents_parsed_date'];

    for (const indexName of indexNames) {
      const indexExists = table?.indices.some(index => index.name === indexName);
      if (!indexExists) {
        if (indexName === 'idx_documents_parsed_provider') {
          await queryRunner.query(`CREATE INDEX idx_documents_parsed_provider ON documents(parsed_provider)`);
        } else if (indexName === 'idx_documents_parsed_category') {
          await queryRunner.query(`CREATE INDEX idx_documents_parsed_category ON documents(parsed_category)`);
        } else if (indexName === 'idx_documents_parsed_date') {
          await queryRunner.query(`CREATE INDEX idx_documents_parsed_date ON documents(parsed_date)`);
        }
        console.log(`Created index ${indexName}`);
      } else {
        console.log(`Index ${indexName} already exists, skipping`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_documents_parsed_provider;
      DROP INDEX IF EXISTS idx_documents_parsed_category;
      DROP INDEX IF EXISTS idx_documents_parsed_date;
    `);

    // Supprimer les colonnes
    await queryRunner.dropColumns('documents', [
      'parsed_provider',
      'parsed_amount',
      'parsed_currency',
      'parsed_date',
      'parsed_frequency',
      'parsed_category',
      'parsing_confidence',
    ]);
  }
}
