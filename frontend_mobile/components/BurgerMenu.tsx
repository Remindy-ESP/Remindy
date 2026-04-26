import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {AppRoute} from "@/navigation/MenuConfig";

interface BurgerMenuProps {
    isVisible: boolean;
    onClose: () => void;
    items: AppRoute[];
}

const { width } = Dimensions.get('window');

export default function BurgerMenu({ isVisible, onClose, items }: BurgerMenuProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleNavigation = (route: string | null) => {
        if (route) {
            onClose();
            router.push(route as any);
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.headerContainer, { top: insets.top }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.menuCard}>
                    {items.map(item => (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.menuItem}
                            onPress={() => handleNavigation(item.route)}
                        >
                            <Text style={styles.menuItemText}>{item.label}</Text>
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
        backgroundColor: 'rgba(6, 7, 29, 0.95)',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    headerContainer: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
    },
    closeButton: {
        padding: 4,
        marginTop: 10,
    },
    menuCard: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        marginTop: width * 0.4,
    },
    menuItem: {
        width: '100%',
        paddingVertical: 12,
    },
    menuItemText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'System',
    },
});
