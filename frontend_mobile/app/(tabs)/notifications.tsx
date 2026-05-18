import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService, Notification, NotificationType } from '../../services/api';
import { categoryService } from '../../services/api/category.service';
import { subscriptionService } from '../../services/api/subscription.service';
import type { Category, Subscription } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/Button';

export default function NotificationsScreen() {
    const { user } = useAuth();
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
            setNotifications(data || []);
            setCategories(cats || []);
            setSubscriptions(subs || []);
        } catch (err: any) {
            console.error('Failed to fetch notifications', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des notifications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchNotifications();
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
        fetchNotifications();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            // Mettre à jour localement
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
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
            Alert.alert('Erreur', 'Impossible de supprimer la notification');
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

    const handleDeleteAll = () => {
        Alert.alert(
            'Tout supprimer',
            'Voulez-vous vraiment supprimer toutes vos notifications ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Supprimer', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await notificationService.deleteAllNotifications();
                            setNotifications([]);
                        } catch (err) {
                            console.error('Failed to delete all notifications', err);
                            Alert.alert('Erreur', 'Impossible de supprimer les notifications');
                        }
                    }
                }
            ]
        );
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

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        _dragX: Animated.AnimatedInterpolation<number>,
        id: string,
    ) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80, 0],
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

    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        _dragX: Animated.AnimatedInterpolation<number>,
        id: string,
    ) => {
        const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-80, 0],
        });

        const opacity = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
        });

        return (
            <Animated.View style={[styles.deleteActionLeft, { transform: [{ translateX }], opacity }]}>
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

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const isRead = !!item.read_at;
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : '';

        return (
            <Swipeable
                ref={(ref) => {
                    // Close previous swipeable when a new one opens
                    if (ref) {
                        ref.close;
                    }
                }}
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
                renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, item.id)}
                onSwipeableOpen={() => {
                    // Close previous open swipeable
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
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>
                            Vos alertes et rappels
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {hasUnread && (
                            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                                <Ionicons name="checkmark-done-outline" size={18} color="#4CAF50" />
                                <Text style={styles.markAllText}>Tout lu</Text>
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
                label={selectedCategory || "Catégories"}
                isOpen={categoriesOpen}
            />

            {categoriesOpen && (
                <View style={styles.categoriesContainer}>
                    {categories.length === 0 ? (
                        <Text style={{ color: '#999', padding: 16, textAlign: 'center' }}>
                            Aucune catégorie disponible
                        </Text>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.categoryItem}
                                onPress={() => {
                                    setSelectedCategory(null);
                                    setCategoriesOpen(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.categoryText}>Toutes les catégories</Text>
                            </TouchableOpacity>
                            {categories.map((category: Category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setSelectedCategory(category.name);
                                        setCategoriesOpen(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.categoryText}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            )}
            
            {error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                        <Text style={styles.retryText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#555" />
                    <Text style={styles.emptyText}>
                        {selectedCategory
                            ? `Aucune notification pour "${selectedCategory}"`
                            : 'Pas de notifications pour le moment'}
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
    deleteActionLeft: {
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

    // Category Filter Styles
    categoriesContainer: {
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
        minWidth: 146,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
        zIndex: 1000,
    },
    categoryItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F1F39',
        textAlign: 'center',
    },
});
