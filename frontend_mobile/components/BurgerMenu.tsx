import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BurgerMenuProps {
    isVisible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
    'Accueil',
    'Dashboard',
    'Abonnements',
    'Notifications',
    'Cloud',
    'Promos',
    'Légal',
];

export default function BurgerMenu({ isVisible, onClose }: BurgerMenuProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.headerContainer, { top: insets.top }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.menuCard}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem}>
                            <Text style={styles.menuItemText}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 7, 29, 0.95)', // Dark background with high opacity
        justifyContent: 'flex-start', // Align to top
        alignItems: 'center',
    },
    headerContainer: {
        position: 'absolute',
        left: 20,
        zIndex: 10, // Ensure it's above everything
        // Top will be set dynamically via style prop with insets
    },
    closeButton: {
        padding: 4,
        marginTop: 10, // Approximate alignment with header vertical center
    },
    menuCard: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'flex-start', // Align items to the start (left)
        marginTop: width * 0.4, // Push down from the top (approx 15-20% of screen height visually)
    },
    menuItem: {
        width: '100%',
        paddingVertical: 12,
    },
    menuItemText: {
        fontSize: 18,
        fontWeight: '700', // Bold text
        color: '#000',
        fontFamily: 'System', // Or specific font if available
    },
});
