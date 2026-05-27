import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { notificationService, Notification, NotificationType } from '../../services/api';
import { categoryService } from '../../services/api/category.service';
import { subscriptionService } from '../../services/api/subscription.service';
import type { Category, Subscription } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import { formatDate } from '@/utils/format';
import Button from '@/components/Button';
import CategoryDropdown from '@/components/CategoryDropdown';
import { screenHeaderStyles as shared } from '@/styles/screenHeader';

export default function NotificationsScreen() {
    const { user } = useAuth();
    const { t, language } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const openSwipeableRef = useRef<Swipeable | null>(null);

    // Category filter state
    const [categories, setCategories] = useState<Category[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoriesOpen, setCategoriesOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setError(null);
            const [data, cats, subs] = await Promise.all([
                notificationService.getNotifications({ limit: 50 }),
                categoryService.getAll().catch(() => []),
                subscriptionService.getAll().catch(() => []),
            ]);
            setNotifications(Array.isArray(data) ? data : []);
            setCategories(Array.isArray(cats) ? cats : []);
            setSubscriptions(Array.isArray(subs) ? subs : []);
        } catch (err: any) {
            console.error('Failed to fetch notifications', err);
            setError(err.response?.data?.message || t('notifications.loadError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                void fetchNotifications();
            }
        }, [user, fetchNotifications])
    );

    // Build subscriptionId -> categoryName map
    const subscriptionCategoryMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        for (const sub of subscriptions) {
            if (sub.categoryId) {
                const cat = categories.find(c => c.id === sub.categoryId);
                if (cat) {
                    map[sub.id] = cat.name;
                }
            }
        }
        return map;
    }, [subscriptions, categories]);

    // Filter notifications by selected category
    const filteredNotifications = React.useMemo(() => {
        if (!selectedCategory) return notifications;
        return notifications.filter(n => {
            const subId = n.metadata?.subscriptionId;
            if (!subId) return false;
            return subscriptionCategoryMap[subId] === selectedCategory;
        });
    }, [notifications, selectedCategory, subscriptionCategoryMap]);

    const onRefresh = () => {
        setRefreshing(true);
        void fetchNotifications();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
            toast.error('Impossible de supprimer la notification');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = await showConfirm({
            title: t('notifications.deleteAllTitle'),
            message: t('notifications.deleteAllMessage'),
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
            destructive: true,
        });
        if (!confirmed) return;
        try {
            await notificationService.deleteAllNotifications();
            setNotifications([]);
        } catch (err) {
            console.error('Failed to delete all notifications', err);
            toast.error('Impossible de supprimer les notifications');
        }
    };

    const hasUnread = filteredNotifications.some(n => !n.read_at);
    const hasNotifications = filteredNotifications.length > 0;

    const getIconName = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'subscription_renewal':
            case 'subscription_renewed': return 'calendar-outline';
            case 'payment_overdue': return 'alert-circle-outline';
            case 'trial_ending': return 'hourglass-outline';
            case 'document_expiry':
            case 'document_processed': return 'document-text-outline';
            case 'reminder': return 'time-outline';
            case 'system': return 'information-circle-outline';
            default: return 'notifications-outline';
        }
    };

    const getIconColor = (type: NotificationType): string => {
        switch (type) {
            case 'payment_overdue': return '#FF5252';
            case 'subscription_renewal':
            case 'subscription_renewed': return '#4CAF50';
            case 'trial_ending': return '#FF9800';
            case 'document_expiry':
            case 'document_processed': return '#2196F3';
            default: return '#E0E0E0';
        }
    };

    const getCardBackground = (type: NotificationType): string => {
        switch (type) {
            case 'subscription_renewal':
            case 'subscription_renewed': return 'rgba(76, 175, 80, 0.08)';
            case 'trial_ending': return 'rgba(255, 152, 0, 0.08)';
            case 'payment_overdue': return 'rgba(255, 82, 82, 0.08)';
            case 'document_expiry':
            case 'document_processed': return 'rgba(33, 150, 243, 0.08)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    };

    const renderSwipeAction = (
        progress: Animated.AnimatedInterpolation<number>,
        id: string,
        fromRight: boolean,
    ) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [fromRight ? 80 : -80, 0],
        });
        const opacity = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
        });
        return (
            <Animated.View style={[styles.deleteAction, { transform: [{ translateX }], opacity }]}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(id)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                    <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>, id: string) =>
        renderSwipeAction(progress, id, true);

    const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>, id: string) =>
        renderSwipeAction(progress, id, false);

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const isRead = !!item.read_at;
        const date = item.created_at
            ? formatDate(item.created_at, language, {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : '';

        return (
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, item.id)}
                onSwipeableOpen={() => {
                    if (openSwipeableRef.current) {
                        openSwipeableRef.current.close();
                    }
                }}
                overshootRight={false}
                overshootLeft={false}
                friction={2}
                rightThreshold={40}
                leftThreshold={40}
            >
                <TouchableOpacity
                    style={[styles.notificationCard, { backgroundColor: getCardBackground(item.type) }, isRead && styles.notificationCardRead]}
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
                        <Text style={[styles.notificationBody, !isRead && styles.textUnread]} numberOfLines={3}>
                            {item.body}
                        </Text>
                        {!isRead && (
                            <View style={styles.unreadDot} />
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
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
                <View style={styles.headerTop}>
                    <View>
                        <Text style={shared.headerTitle}>{t('notifications.headerTitle')}</Text>
                        <Text style={styles.headerSubtitle}>
                            {t('notifications.headerSubtitle')}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {hasUnread && (
                            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                                <Ionicons name="checkmark-done-outline" size={18} color="#4CAF50" />
                                <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
                            </TouchableOpacity>
                        )}
                        {hasNotifications && (
                            <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAll}>
                                <Ionicons name="trash-outline" size={18} color="#FF5252" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Category Filter */}
            <Button
                onPress={() => setCategoriesOpen(!categoriesOpen)}
                label={selectedCategory || t('notifications.allCategories')}
                isOpen={categoriesOpen}
            />

            {categoriesOpen && (
                <CategoryDropdown
                    categories={categories}
                    emptyLabel={t('notifications.noCategories')}
                    allLabel={t('notifications.allCategories')}
                    onSelectAll={() => { setSelectedCategory(null); setCategoriesOpen(false); }}
                    onSelect={(name) => { setSelectedCategory(name); setCategoriesOpen(false); }}
                />
            )}

            {error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                        <Text style={styles.retryText}>{t('notifications.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#555" />
                    <Text style={styles.emptyText}>
                        {selectedCategory
                            ? t('notifications.emptyForCategory', { category: selectedCategory })
                            : t('notifications.empty')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
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
    headerSubtitle: {
        fontSize: 16,
        color: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    markAllText: {
        color: '#4CAF50',
        fontSize: 13,
        fontWeight: '600',
    },
    deleteAllButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 82, 82, 0.15)',
        width: 36,
        height: 36,
        borderRadius: 18,
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

    // Swipe Delete Styles
    deleteAction: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        gap: 4,
    },
    deleteText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

});
