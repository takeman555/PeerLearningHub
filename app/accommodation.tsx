import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';

interface Accommodation {
  id: number;
  name: string;
  location: string;
  type: 'hotel' | 'hostel' | 'apartment' | 'retreat';
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  amenities: string[];
  images: string[];
  description: string;
  availability: boolean;
  learningFacilities: string[];
}

interface Booking {
  id: number;
  accommodationName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingDate: string;
}

export default function Accommodation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'bookings' | 'favorites'>('search');
  const [searchLocation, setSearchLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('1');

  const [accommodations] = useState<Accommodation[]>([
    {
      id: 1,
      name: 'Tokyo Learning Hub Hotel',
      location: '東京, 日本',
      type: 'hotel',
      price: 12000,
      currency: 'JPY',
      rating: 4.8,
      reviews: 324,
      amenities: ['WiFi', 'コワーキングスペース', '朝食', 'ジム'],
      images: ['🏨'],
      description: '東京中心部にある学習者向けホテル。24時間利用可能なコワーキングスペースと図書館を完備。',
      availability: true,
      learningFacilities: ['図書館', 'セミナールーム', 'プログラミングラボ', '静音エリア']
    },
    {
      id: 2,
      name: 'Silicon Valley Tech Hostel',
      location: 'サンフランシスコ, アメリカ',
      type: 'hostel',
      price: 85,
      currency: 'USD',
      rating: 4.6,
      reviews: 156,
      amenities: ['WiFi', 'キッチン', 'ラウンジ', '駐車場'],
      images: ['🏠'],
      description: 'テック業界の中心地にあるホステル。起業家や開発者が多く滞在し、ネットワーキングに最適。',
      availability: true,
      learningFacilities: ['ハッカソンルーム', 'ピッチエリア', 'VRラボ', 'メンタリングスペース']
    },
    {
      id: 3,
      name: 'Berlin Creative Apartment',
      location: 'ベルリン, ドイツ',
      type: 'apartment',
      price: 120,
      currency: 'EUR',
      rating: 4.7,
      reviews: 89,
      amenities: ['WiFi', 'キッチン', '洗濯機', 'バルコニー'],
      images: ['🏢'],
      description: 'クリエイティブ地区にあるモダンなアパートメント。デザイナーやアーティストに人気。',
      availability: false,
      learningFacilities: ['デザインスタジオ', 'アートワークショップ', '3Dプリンター', 'フォトスタジオ']
    },
    {
      id: 4,
      name: 'Bali Digital Nomad Retreat',
      location: 'バリ, インドネシア',
      type: 'retreat',
      price: 45,
      currency: 'USD',
      rating: 4.9,
      reviews: 267,
      amenities: ['WiFi', 'プール', 'ヨガスタジオ', 'カフェ'],
      images: ['🏝️'],
      description: 'デジタルノマド向けのリトリート施設。自然に囲まれた環境で集中して学習できます。',
      availability: true,
      learningFacilities: ['コワーキングスペース', '瞑想ルーム', 'ワークショップエリア', 'ネットワーキングラウンジ']
    }
  ]);

  const [bookings] = useState<Booking[]>([
    {
      id: 1,
      accommodationName: 'Tokyo Learning Hub Hotel',
      location: '東京, 日本',
      checkIn: '2024-02-15',
      checkOut: '2024-02-20',
      guests: 1,
      totalPrice: 60000,
      status: 'confirmed',
      bookingDate: '2024-01-10'
    },
    {
      id: 2,
      accommodationName: 'Silicon Valley Tech Hostel',
      location: 'サンフランシスコ, アメリカ',
      checkIn: '2024-03-01',
      checkOut: '2024-03-07',
      guests: 1,
      totalPrice: 510,
      status: 'pending',
      bookingDate: '2024-01-12'
    },
    {
      id: 3,
      accommodationName: 'Bali Digital Nomad Retreat',
      location: 'バリ, インドネシア',
      checkIn: '2023-12-10',
      checkOut: '2023-12-17',
      guests: 1,
      totalPrice: 315,
      status: 'confirmed',
      bookingDate: '2023-11-15'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'hostel': return '🏠';
      case 'apartment': return '🏢';
      case 'retreat': return '🏝️';
      default: return '🏨';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'hotel': return 'ホテル';
      case 'hostel': return 'ホステル';
      case 'apartment': return 'アパートメント';
      case 'retreat': return 'リトリート';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '確定';
      case 'pending': return '保留中';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const handleBookAccommodation = (accommodationId: number) => {
    console.log(`Booking accommodation ${accommodationId}`);
  };

  const handleCancelBooking = (bookingId: number) => {
    console.log(`Cancelling booking ${bookingId}`);
  };

  const renderSearch = () => (
    <ScrollView style={styles.tabContent}>
      {/* Search Form */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchTitle}>🔍 宿泊施設を検索</Text>
        
        <View style={styles.searchForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>目的地</Text>
            <TextInput
              style={styles.textInput}
              placeholder="都市名または国名を入力"
              value={searchLocation}
              onChangeText={setSearchLocation}
            />
          </View>
          
          <View style={styles.dateRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>チェックイン</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={checkInDate}
                onChangeText={setCheckInDate}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>チェックアウト</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={checkOutDate}
                onChangeText={setCheckOutDate}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ゲスト数</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1"
              value={guests}
              onChangeText={setGuests}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>検索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>🏨 おすすめの宿泊施設</Text>
        
        {accommodations.map((accommodation) => (
          <View key={accommodation.id} style={styles.accommodationCard}>
            <View style={styles.accommodationHeader}>
              <View style={styles.accommodationInfo}>
                <Text style={styles.accommodationIcon}>{getTypeIcon(accommodation.type)}</Text>
                <View style={styles.accommodationDetails}>
                  <Text style={styles.accommodationName}>{accommodation.name}</Text>
                  <Text style={styles.accommodationLocation}>{accommodation.location}</Text>
                  <Text style={styles.accommodationType}>{getTypeText(accommodation.type)}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  {accommodation.currency === 'JPY' ? '¥' : accommodation.currency === 'USD' ? '$' : '€'}
                  {accommodation.price.toLocaleString()}
                </Text>
                <Text style={styles.priceUnit}>/ 泊</Text>
              </View>
            </View>
            
            <Text style={styles.description}>{accommodation.description}</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {accommodation.rating}</Text>
              <Text style={styles.reviews}>({accommodation.reviews}件のレビュー)</Text>
            </View>
            
            {/* Learning Facilities */}
            <View style={styles.facilitiesContainer}>
              <Text style={styles.facilitiesTitle}>📚 学習施設:</Text>
              <View style={styles.facilitiesList}>
                {accommodation.learningFacilities.map((facility, index) => (
                  <View key={index} style={styles.facilityTag}>
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Amenities */}
            <View style={styles.amenitiesContainer}>
              <Text style={styles.amenitiesTitle}>🛎️ 設備:</Text>
              <View style={styles.amenitiesList}>
                {accommodation.amenities.map((amenity, index) => (
                  <Text key={index} style={styles.amenityText}>• {amenity}</Text>
                ))}
              </View>
            </View>
            
            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.bookButton, 
                !accommodation.availability && styles.bookButtonDisabled
              ]}
              onPress={() => handleBookAccommodation(accommodation.id)}
              disabled={!accommodation.availability}
            >
              <Text style={styles.bookButtonText}>
                {accommodation.availability ? '予約する' : '満室'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderBookings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.bookingsHeader}>
        <Text style={styles.bookingsTitle}>📋 予約履歴</Text>
        <Text style={styles.bookingsSubtitle}>過去と今後の予約を管理</Text>
      </View>
      
      {bookings.map((booking) => (
        <View key={booking.id} style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingName}>{booking.accommodationName}</Text>
              <Text style={styles.bookingLocation}>{booking.location}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.bookingDetails}>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>チェックイン:</Text>
              <Text style={styles.bookingValue}>{booking.checkIn}</Text>
            </View>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>チェックアウト:</Text>
              <Text style={styles.bookingValue}>{booking.checkOut}</Text>
            </View>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>ゲスト数:</Text>
              <Text style={styles.bookingValue}>{booking.guests}名</Text>
            </View>
            <View style={styles.bookingRow}>
              <Text style={styles.bookingLabel}>合計金額:</Text>
              <Text style={styles.bookingPrice}>
                {booking.totalPrice >= 1000 ? '¥' : '$'}{booking.totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>
          
          {booking.status === 'confirmed' && (
            <View style={styles.bookingActions}>
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsButtonText}>詳細を見る</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => handleCancelBooking(booking.id)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      
      {bookings.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>予約履歴がありません</Text>
          <Text style={styles.emptySubtext}>宿泊施設を検索して予約してみましょう</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderFavorites = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.favoritesHeader}>
        <Text style={styles.favoritesTitle}>❤️ お気に入り</Text>
        <Text style={styles.favoritesSubtitle}>保存した宿泊施設</Text>
      </View>
      
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>お気に入りがありません</Text>
        <Text style={styles.emptySubtext}>気になる宿泊施設をお気に入りに追加しましょう</Text>
      </View>
    </ScrollView>
  );

  return (
    <AuthGuard>
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            検索
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>
            予約履歴
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            お気に入り
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'search' && renderSearch()}
      {activeTab === 'bookings' && renderBookings()}
      {activeTab === 'favorites' && renderFavorites()}
    </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  // Search Styles
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  searchForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  dateRow: {
    flexDirection: 'row',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Results Styles
  resultsContainer: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  accommodationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accommodationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accommodationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accommodationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  accommodationDetails: {
    flex: 1,
  },
  accommodationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  accommodationLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  accommodationType: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  priceUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviews: {
    fontSize: 12,
    color: '#6b7280',
  },
  facilitiesContainer: {
    marginBottom: 12,
  },
  facilitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  facilityTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  facilityText: {
    fontSize: 10,
    color: '#3b82f6',
  },
  amenitiesContainer: {
    marginBottom: 16,
  },
  amenitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  amenitiesList: {
    gap: 2,
  },
  amenityText: {
    fontSize: 11,
    color: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bookings Styles
  bookingsHeader: {
    marginBottom: 20,
  },
  bookingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookingsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bookingLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 6,
    marginBottom: 16,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookingValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  viewDetailsButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  // Favorites Styles
  favoritesHeader: {
    marginBottom: 20,
  },
  favoritesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  favoritesSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
  },
});