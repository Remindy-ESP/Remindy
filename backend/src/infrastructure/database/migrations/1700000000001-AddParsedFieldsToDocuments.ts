import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddParsedFieldsToDocuments1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les colonnes pour les données parsées par Gemini
    await queryRunner.addColumns('documents', [
      new TableColumn({
        name: 'parsed_provider',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'Nom du fournisseur/service extrait par Gemini',
      }),
      new TableColumn({
        name: 'parsed_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Montant de l\'abonnement extrait',
      }),
      new TableColumn({
        name: 'parsed_currency',
        type: 'varchar',
        length: '3',
        isNullable: true,
        default: "'EUR'",
        comment: 'Devise (EUR, USD, etc.)',
      }),
      new TableColumn({
        name: 'parsed_date',
        type: 'date',
        isNullable: true,
        comment: 'Date de début ou d\'échéance',
      }),
      new TableColumn({
        name: 'parsed_frequency',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Fréquence: mensuel, trimestriel, annuel, ponctuel',
      }),
      new TableColumn({
        name: 'parsed_category',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Catégorie: énergie, internet, assurance, SaaS, etc.',
      }),
      new TableColumn({
        name: 'parsing_confidence',
        type: 'float',
        isNullable: true,
        comment: 'Score de confiance du parsing (0-1)',
      }),
    ]);

    // Créer des index pour améliorer les performances de recherche
    await queryRunner.query(`
      CREATE INDEX idx_documents_parsed_provider ON documents(parsed_provider);
      CREATE INDEX idx_documents_parsed_category ON documents(parsed_category);
      CREATE INDEX idx_documents_parsed_date ON documents(parsed_date);
    `);
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
