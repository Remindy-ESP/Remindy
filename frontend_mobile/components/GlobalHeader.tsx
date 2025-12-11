import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BurgerMenu from './BurgerMenu';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GlobalHeader() {
    const insets = useSafeAreaInsets();
    const headerHeight = SCREEN_HEIGHT * 0.07 + insets.top; // Adjusted height calculation
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    return (
        <>
            <View style={[styles.container, { height: headerHeight, paddingTop: insets.top }]}>
                <View style={styles.content}>
                    {/* Left: Burger Menu */}
                    <TouchableOpacity
                        onPress={() => setIsMenuVisible(true)}
                        style={styles.iconButton}
                    >
                        <Ionicons name="menu-outline" size={32} color="#fff" />
                    </TouchableOpacity>

                    {/* Right: Profile Picture (Placeholder) */}
                    <TouchableOpacity style={styles.profileButton}>
                        {/* Placeholder for profile image based on screenshot */}
                        <View style={styles.avatarPlaceholder}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/100' }}
                                style={styles.avatar}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <BurgerMenu
                isVisible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#06071D', // Adjusted to match the dark theme background
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
});
