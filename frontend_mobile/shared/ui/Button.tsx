import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
    readonly onPress: () => void;
    readonly label: string;
    readonly isOpen: boolean;
}

export default function Button({onPress, label, isOpen}: ButtonProps) {

    return (

        <View style={styles.ButtonContainer}>
            <TouchableOpacity
                style={styles.Button}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Text style={styles.ButtonText}>{label}</Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1F1F39"
                />
            </TouchableOpacity>
        </View>

    )
}

const styles = StyleSheet.create({
    ButtonContainer: {
        marginHorizontal: 64,
        marginBottom: 16,
        alignItems: 'center',
    },
    Button: {
        backgroundColor: '#fff',
        borderRadius: 6,
        height: 23,
        width: 146,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F1F39',
        marginRight: 6,
    },
});