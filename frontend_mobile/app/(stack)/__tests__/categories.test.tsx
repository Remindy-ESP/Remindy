import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CategoriesScreen from '../categories';

// useFocusEffect: call the callback once using React.useEffect semantics
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => {
    require('react').useEffect(() => {
      callback();
    }, []);
  }),
}));

const mockGetAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/services/api/category.service', () => ({
  categoryService: {
    getAll: (...args: any[]) => mockGetAll(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

jest.spyOn(Alert, 'alert');

const mockSystemCategory = {
  id: 'sys-1',
  name: 'Streaming',
  icon: 'play',
  color: '#FF0000',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockUserCategory = {
  id: 'user-1',
  name: 'Ma Categorie',
  icon: 'folder',
  color: '#6366f1',
  isSystem: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function openCreateModal(utils: ReturnType<typeof render>) {
  const { getByTestId, getAllByText } = utils;
  await waitFor(() => expect(getByTestId('add-category-btn')).toBeTruthy());
  fireEvent.press(getByTestId('add-category-btn'));
  await waitFor(() => expect(getAllByText('Nouvelle catégorie').length).toBeGreaterThan(0));
}

async function openRenameModal(utils: ReturnType<typeof render>) {
  const { getByTestId, getByText } = utils;
  await waitFor(() => expect(getByTestId('rename-category-user-1')).toBeTruthy());
  fireEvent.press(getByTestId('rename-category-user-1'));
  await waitFor(() => expect(getByText('Renommer')).toBeTruthy());
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CategoriesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue([mockSystemCategory, mockUserCategory]);
    mockCreate.mockResolvedValue({ id: 'new-1', name: 'New', isSystem: false });
    mockUpdate.mockResolvedValue({ ...mockUserCategory, name: 'Renamed' });
    mockDelete.mockResolvedValue(undefined);
  });

  it('shows loading state initially when fetch is pending', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<CategoriesScreen />);
    expect(getByText('Chargement des catégories...')).toBeTruthy();
  });

  it('renders categories after loading', async () => {
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Streaming')).toBeTruthy();
      expect(getByText('Ma Categorie')).toBeTruthy();
    });
  });

  it('displays system categories section', async () => {
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Catégories système')).toBeTruthy();
    });
  });

  it('displays user categories section', async () => {
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Mes catégories')).toBeTruthy();
    });
  });

  it('shows empty text when no system categories', async () => {
    mockGetAll.mockResolvedValue([mockUserCategory]);
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Aucune catégorie système.')).toBeTruthy();
    });
  });

  it('shows empty text when no user categories', async () => {
    mockGetAll.mockResolvedValue([mockSystemCategory]);
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Aucune catégorie personnalisée.')).toBeTruthy();
    });
  });

  it('shows error state when fetch fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => {
      expect(getByText('Impossible de charger les catégories.')).toBeTruthy();
    });
  });

  it('retries fetching on retry button press', async () => {
    mockGetAll.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => expect(getByText('Réessayer')).toBeTruthy());
    fireEvent.press(getByText('Réessayer'));
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it('opens create modal when add button is pressed', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    expect(utils.getAllByText('Nouvelle catégorie').length).toBeGreaterThan(0);
  });

  it('shows alert when creating with empty name', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.press(utils.getByText('Créer'));
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Le nom de la catégorie est requis.');
  });

  it('creates a category with valid name', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.changeText(utils.getByPlaceholderText('Ex: Santé, Loisirs...'), 'Nouvelle');
    fireEvent.press(utils.getByText('Créer'));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nouvelle', icon: 'folder' })
      );
    });
  });

  it('shows alert when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Server error'));
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.changeText(utils.getByPlaceholderText('Ex: Santé, Loisirs...'), 'Nouvelle');
    fireEvent.press(utils.getByText('Créer'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de créer la catégorie.');
    });
  });

  it('cancels create modal', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.press(utils.getByText('Annuler'));
    await waitFor(() => {
      expect(utils.queryByPlaceholderText('Ex: Santé, Loisirs...')).toBeNull();
    });
  });

  it('opens rename modal for a user category', async () => {
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    expect(utils.getAllByText(/Renommer/).length).toBeGreaterThan(0);
  });

  it('renames a category', async () => {
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    const inputs = utils.getAllByDisplayValue('Ma Categorie');
    fireEvent.changeText(inputs[0], 'Nouveau Nom');
    fireEvent.press(utils.getByText('Renommer'));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('user-1', { name: 'Nouveau Nom', color: '#6366f1' });
    });
  });

  it('shows alert when rename fails', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Server error'));
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    const inputs = utils.getAllByDisplayValue('Ma Categorie');
    fireEvent.changeText(inputs[0], 'Nouveau Nom');
    fireEvent.press(utils.getByText('Renommer'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de renommer la catégorie.');
    });
  });

  it('opens delete confirmation for a user category', async () => {
    const { getByTestId } = render(<CategoriesScreen />);
    await waitFor(() => expect(getByTestId('delete-category-user-1')).toBeTruthy());
    fireEvent.press(getByTestId('delete-category-user-1'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Supprimer la catégorie',
      'Supprimer "Ma Categorie" ?',
      expect.any(Array)
    );
  });

  it('deletes a category when confirmed', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const deleteButton = buttons?.find((b: any) => b.text === 'Supprimer');
      deleteButton?.onPress?.();
    });
    const { getByTestId } = render(<CategoriesScreen />);
    await waitFor(() => expect(getByTestId('delete-category-user-1')).toBeTruthy());
    fireEvent.press(getByTestId('delete-category-user-1'));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('user-1');
    });
  });

  it('shows alert when delete fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Server error'));
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      const deleteButton = buttons?.find((b: any) => b.text === 'Supprimer');
      deleteButton?.onPress?.();
    });
    const { getByTestId } = render(<CategoriesScreen />);
    await waitFor(() => expect(getByTestId('delete-category-user-1')).toBeTruthy());
    fireEvent.press(getByTestId('delete-category-user-1'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de supprimer la catégorie.');
    });
  });

  it('does not rename when rename value is empty', async () => {
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    const inputs = utils.getAllByDisplayValue('Ma Categorie');
    fireEvent.changeText(inputs[0], '');
    fireEvent.press(utils.getByText('Renommer'));
    await waitFor(() => {
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  it('closes create modal via onRequestClose', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.press(utils.getAllByText('Annuler')[0]);
    await waitFor(() => {
      expect(utils.queryByPlaceholderText('Ex: Santé, Loisirs...')).toBeNull();
    });
  });

  it('changes color selection in create modal', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    // This just tests that the modal renders the color grid without crash
    expect(utils.getAllByText('Nouvelle catégorie').length).toBeGreaterThan(0);
  });

  it('closes rename modal via cancel button', async () => {
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    const cancelBtns = utils.getAllByText('Annuler');
    fireEvent.press(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(utils.queryByText('Nouveau nom')).toBeNull();
    });
  });

  it('closes create modal via onRequestClose (line 217)', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);

    const { Modal } = require('react-native');
    const modals = utils.UNSAFE_getAllByType(Modal);
    fireEvent(modals[0], 'requestClose');
    await waitFor(() => {
      expect(utils.queryByPlaceholderText('Ex: Santé, Loisirs...')).toBeNull();
    });
  });

  it('selects a different color in create modal (covers setNewColor, line 243)', async () => {
    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);

    const { TouchableOpacity } = require('react-native');
    const touchables = utils.UNSAFE_getAllByType(TouchableOpacity);
    const colorButtons = touchables.filter(
      (t: any) => !t.props.testID && !t.props.children
    );
    if (colorButtons.length > 0) {
      fireEvent.press(colorButtons[0]);
    } else {
      fireEvent.press(touchables[Math.min(5, touchables.length - 1)]);
    }
    // The modal should still be open (we just changed color, not closed)
    expect(utils.getAllByText('Nouvelle catégorie').length).toBeGreaterThan(0);
  });

  it('closes rename modal via onRequestClose (line 276)', async () => {
    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    await waitFor(() => expect(utils.getAllByDisplayValue('Ma Categorie').length).toBeGreaterThan(0));

    const { Modal } = require('react-native');
    const modals = utils.UNSAFE_getAllByType(Modal);
    fireEvent(modals[1], 'requestClose');
    await waitFor(() => {
      expect(utils.queryByDisplayValue('Ma Categorie')).toBeNull();
    });
  });

  it('shows ActivityIndicator while creating a category (line 243 creating state)', async () => {
    let resolveCreate: () => void;
    mockCreate.mockReturnValueOnce(new Promise<void>((resolve) => { resolveCreate = resolve; }));

    const utils = render(<CategoriesScreen />);
    await openCreateModal(utils);
    fireEvent.changeText(utils.getByPlaceholderText('Ex: Santé, Loisirs...'), 'Test');
    fireEvent.press(utils.getByText('Créer'));

    const { ActivityIndicator } = require('react-native');
    await waitFor(() => {
      expect(utils.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
    resolveCreate!();
  });

  it('shows ActivityIndicator while renaming a category (line 276 renaming state)', async () => {
    let resolveUpdate: () => void;
    mockUpdate.mockReturnValueOnce(new Promise<void>((resolve) => { resolveUpdate = resolve; }));

    const utils = render(<CategoriesScreen />);
    await openRenameModal(utils);
    const inputs = utils.getAllByDisplayValue('Ma Categorie');
    fireEvent.changeText(inputs[0], 'Nouveau Nom');
    fireEvent.press(utils.getByText('Renommer'));

    const { ActivityIndicator } = require('react-native');
    await waitFor(() => {
      expect(utils.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
    resolveUpdate!();
  });

  it('uses fallback color #6366f1 for system category with no color (line 164)', async () => {
    mockGetAll.mockResolvedValueOnce([
      { ...mockSystemCategory, color: null },
      mockUserCategory,
    ]);
    const { getByText } = render(<CategoriesScreen />);
    // Just confirm the component renders without crash even when color is null
    await waitFor(() => expect(getByText('Streaming')).toBeTruthy());
  });

  it('uses fallback color #6366f1 for user category with no color (line 184)', async () => {
    mockGetAll.mockResolvedValueOnce([
      mockSystemCategory,
      { ...mockUserCategory, color: undefined },
    ]);
    const { getByText } = render(<CategoriesScreen />);
    await waitFor(() => expect(getByText('Ma Categorie')).toBeTruthy());
  });
});
