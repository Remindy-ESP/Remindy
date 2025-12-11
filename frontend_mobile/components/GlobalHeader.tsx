import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BurgerMenu from './BurgerMenu';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GlobalHeader() {
    const insets = useSafeAreaInsets();
    const headerHeight = SCREEN_HEIGHT * 0.07 + insets.top;
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
    const router = useRouter();

    const toggleProfileMenu = () => {
        setIsProfileMenuVisible(!isProfileMenuVisible);
    };

    const closeProfileMenu = () => {
        setIsProfileMenuVisible(false);
    };

    const traverseToProfile = () => {
        closeProfileMenu();
        router.push('/(tabs)/profile');
    };

    return (
        <>
            <View
                style={[
                    styles.container,
                    { height: headerHeight, paddingTop: insets.top },
                ]}
            >
                <View style={styles.content}>
                    {/* Left: Burger Menu */}
                    <TouchableOpacity
                        onPress={() => setIsMenuVisible(true)}
                        style={styles.iconButton}
                    >
                        <Ionicons name="menu-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ position: 'relative', zIndex: 10 }}>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={toggleProfileMenu}
                        >
                            <View style={styles.avatarPlaceholder}>
                                <Image
                                    source={{ uri: 'https://i.pravatar.cc/100' }}
                                    style={styles.avatar}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <BurgerMenu
                isVisible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
            />

            <Modal
                visible={isProfileMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeProfileMenu}
            >
                <TouchableWithoutFeedback onPress={closeProfileMenu}>
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.dropdownMenu,
                                { top: headerHeight - 10, right: 20 },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={traverseToProfile}
                            >
                                <Text style={styles.menuItemText}>Profil</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={closeProfileMenu}
                            >
                                <Text style={styles.menuItemText}>Catégories</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={closeProfileMenu}
                            >
                                <Text style={styles.menuItemText}>Réglages</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#06071D',
        zIndex: 100,
        borderBottomWidth: 0,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    iconButton: {
        padding: 4,
    },
    profileButton: {
        padding: 4,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    dropdownMenu: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 16,
        width: 200,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 10,
    },
});
