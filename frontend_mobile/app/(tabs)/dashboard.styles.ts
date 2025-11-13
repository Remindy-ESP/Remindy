import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  calendarContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Menu de filtrage temporel
  timePeriodSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  timePeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  timePeriodMenu: {
    backgroundColor: '#1e1b4b', // Bleu foncé inspiré de la maquette
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timePeriodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePeriodTabActive: {
    backgroundColor: '#fff',
  },
  timePeriodTabInactive: {
    backgroundColor: 'transparent',
  },
  timePeriodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePeriodTabTextActive: {
    color: '#1e1b4b',
  },
  timePeriodTabTextInactive: {
    color: '#fff',
    opacity: 0.7,
  },
  // Section de contenu sous le menu
  contentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    marginVertical: 20,
  },
});
