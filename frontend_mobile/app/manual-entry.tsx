import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MOCK_CATEGORIES, Category } from '@/constants/categories';

export default function ManualEntryScreen() {
  const router = useRouter();
  const [entreprise, setEntreprise] = useState('');
  const [abonnement, setAbonnement] = useState('');
  const [montant, setMontant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [moyenPaiement, setMoyenPaiement] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [showEndDate, setShowEndDate] = useState(false);
  const [dateFin, setDateFin] = useState('');

  const visibleCategories = showAllCategories
    ? MOCK_CATEGORIES
    : MOCK_CATEGORIES.slice(0, 4);

  const handleSubmit = () => {
    // TODO: Implement submission logic
    console.log({
      entreprise,
      abonnement,
      montant,
      selectedCategory,
      moyenPaiement,
      dateDebut,
      recurrence,
      dateFin: showEndDate ? dateFin : null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle opération</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Entreprise */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Entreprise</Text>
            <TextInput
              style={styles.input}
              placeholder="eg: Apple"
              placeholderTextColor="#999"
              value={entreprise}
              onChangeText={setEntreprise}
            />
          </View>

          {/* Abonnement */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Abonnement</Text>
            <TextInput
              style={styles.input}
              placeholder="eg: Stockage iCloud"
              placeholderTextColor="#999"
              value={abonnement}
              onChangeText={setAbonnement}
            />
          </View>

          {/* Montant */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Montant</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00 €"
              placeholderTextColor="#999"
              value={montant}
              onChangeText={setMontant}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesTitle}>
              Choisir un tag pour catégoriser ce mouvement
            </Text>
            <View style={styles.categoriesContainer}>
              {visibleCategories.map((category: Category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTag,
                    selectedCategory === category.name && styles.categoryTagSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryTagText,
                      selectedCategory === category.name &&
                        styles.categoryTagTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Show All Categories Button */}
            <TouchableOpacity
              style={styles.showAllButton}
              onPress={() => setShowAllCategories(!showAllCategories)}
              activeOpacity={0.7}
            >
              <Text style={styles.showAllButtonText}>
                {showAllCategories ? 'Masquer les tags' : 'Tous les tags'}
              </Text>
              <Text style={styles.showAllButtonIcon}>
                {showAllCategories ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Moyen de paiement */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Moyen de paiement</Text>
            <View style={styles.selectInput}>
              <TextInput
                style={styles.selectInputText}
                placeholder="eg: Virement manuel"
                placeholderTextColor="#999"
                value={moyenPaiement}
                onChangeText={setMoyenPaiement}
              />
              <Text style={styles.selectIcon}>▼</Text>
            </View>
          </View>

          {/* Date de début */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date de début</Text>
            <TextInput
              style={styles.input}
              placeholder="J/MM/YYYY"
              placeholderTextColor="#999"
              value={dateDebut}
              onChangeText={setDateDebut}
            />
          </View>

          {/* Récurrence */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Récurrence</Text>
            <View style={styles.selectInput}>
              <TextInput
                style={styles.selectInputText}
                placeholder="eg: 1 mois"
                placeholderTextColor="#999"
                value={recurrence}
                onChangeText={setRecurrence}
              />
              <Text style={styles.selectIcon}>▼</Text>
            </View>
          </View>

          {/* Ajouter une date de fin */}
          {!showEndDate ? (
            <TouchableOpacity
              style={styles.addEndDateButton}
              onPress={() => setShowEndDate(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addEndDateButtonText}>Ajouter une date de fin</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date de fin</Text>
              <TextInput
                style={styles.input}
                placeholder="J/MM/YYYY"
                placeholderTextColor="#999"
                value={dateFin}
                onChangeText={setDateFin}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0A0B1E',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1B3D',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 40, // To center the title accounting for back button
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  selectInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  selectIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryTagSelected: {
    backgroundColor: '#4D4D8C',
    borderColor: '#4D4D8C',
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  categoryTagTextSelected: {
    color: '#FFFFFF',
  },
  showAllButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  showAllButtonIcon: {
    fontSize: 10,
    color: '#000000',
  },
  addEndDateButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4D4D8C',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  addEndDateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#5B5B9D',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
