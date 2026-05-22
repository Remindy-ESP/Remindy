import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { notificationService, Notification, NotificationType } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsScreen() {
    const { t, i18n } = useTranslation('settings');
    const { t: tCommon } = useTranslation('common');
    const { t: tErrors } = useTranslation('errors');
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setError(null);
            const data = await notificationService.getNotifications({ limit: 50 });
            setNotifications(data || []);
        } catch (err: any) {
            console.error('Failed to fetch notifications', err);
            setError(err.response?.data?.message || tErrors('notifications.loadFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tErrors]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            // Mettre à jour localement
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const getIconName = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'subscription_renewal': return 'calendar-outline';
            case 'payment_overdue': return 'alert-circle-outline';
            case 'document_expiry': return 'document-text-outline';
            case 'reminder': return 'time-outline';
            case 'system': return 'information-circle-outline';
            default: return 'notifications-outline';
        }
    };

    const getIconColor = (type: NotificationType): string => {
        switch (type) {
            case 'payment_overdue': return '#FF5252';
            case 'subscription_renewal': return '#4CAF50';
            case 'document_expiry': return '#FF9800';
            default: return '#E0E0E0';
        }
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const isRead = !!item.readAt;
        const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString(i18n.language, {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : '';

        return (
            <TouchableOpacity 
                style={[styles.notificationCard, isRead && styles.notificationCardRead]}
                onPress={() => !isRead && handleMarkAsRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
                    <Ionicons name={getIconName(item.type)} size={24} color={getIconColor(item.type)} />
                </View>
                
                <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                        <Text style={[styles.notificationTitle, !isRead && styles.textUnread]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.notificationDate}>{date}</Text>
                    </View>
                    <Text style={[styles.notificationBody, !isRead && styles.textUnread]} numberOfLines={2}>
                        {item.body}
                    </Text>
                    {!isRead && (
                        <View style={styles.unreadDot} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF5252" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('notificationsScreen.headerTitle')}</Text>
                <Text style={styles.headerSubtitle}>
                    {t('notificationsScreen.headerSubtitle')}
                </Text>
            </View>

            {error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                        <Text style={styles.retryText}>{tCommon('actions.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#555" />
                    <Text style={styles.emptyText}>{t('notificationsScreen.empty')}</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotificationItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FF5252"
                            colors={['#FF5252']}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a3e',
    },
    centered: {
        flex: 1,
        backgroundColor: '#1a1a3e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        padding: 20,
        backgroundColor: '#1a1a3e',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#e0e0e0',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        fontSize: 16,
        color: '#e0e0e0',
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: 'rgba(255, 82, 82, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#FF5252',
        fontWeight: 'bold',
    },
    
    // Notification Item Styles
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    notificationCardRead: {
        opacity: 0.7,
        backgroundColor: 'transparent',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        color: '#e0e0e0',
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    notificationDate: {
        fontSize: 12,
        color: '#888',
    },
    notificationBody: {
        fontSize: 14,
        color: '#aaa',
        lineHeight: 20,
    },
    textUnread: {
        color: '#fff',
        fontWeight: 'bold',
    },
    unreadDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5252',
    },
});
