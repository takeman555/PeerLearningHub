// Task 4: 外部宿泊施設カードコンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { ExternalAccommodation } from '../../types/externalSystems';

interface ExternalAccommodationCardProps {
  accommodation: ExternalAccommodation;
  onPress?: (accommodation: ExternalAccommodation) => void;
  onBook?: (accommodation: ExternalAccommodation) => void;
}

export const ExternalAccommodationCard: React.FC<ExternalAccommodationCardProps> = ({ 
  accommodation, 
  onPress, 
  onBook 
}) => {
  const getAccommodationTypeIcon = (type?: string) => {
    switch (type) {
      case 'hostel': return '🏠';
      case 'hotel': return '🏨';
      case 'apartment': return '🏢';
      case 'guesthouse': return '🏡';
      case 'bnb': return '🛏️';
      default: return '🏠';
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Price not available';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency || '$';
    return `${currencySymbol}${price.toFixed(0)}`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = Math.round(rating);
    return '⭐'.repeat(Math.min(stars, 5));
  };

  const formatLocation = () => {
    const parts = [];
    if (accommodation.city) parts.push(accommodation.city);
    if (accommodation.country) parts.push(accommodation.country);
    return parts.join(', ');
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(accommodation)}
      activeOpacity={0.7}
    >
      {accommodation.images && accommodation.images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imageContainer}
          pagingEnabled
        >
          {accommodation.images.slice(0, 3).map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.image} />
          ))}
        </ScrollView>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>
              {getAccommodationTypeIcon(accommodation.accommodation_type)}
            </Text>
            <Text style={styles.name} numberOfLines={2}>
              {accommodation.name}
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatPrice(accommodation.price_per_night, accommodation.currency)}
            </Text>
            <Text style={styles.priceLabel}>per night</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.location}>📍 {formatLocation()}</Text>
          {accommodation.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.stars}>{renderStars(accommodation.rating)}</Text>
              <Text style={styles.rating}>
                {accommodation.rating.toFixed(1)}
                {accommodation.review_count && ` (${accommodation.review_count})`}
              </Text>
            </View>
          )}
        </View>

        {accommodation.description && (
          <Text style={styles.description} numberOfLines={3}>
            {accommodation.description}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.platform}>{accommodation.source_platform}</Text>
            <Text style={styles.accommodationType}>
              {accommodation.accommodation_type}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            {accommodation.max_guests && (
              <Text style={styles.guests}>👥 Up to {accommodation.max_guests} guests</Text>
            )}
            {accommodation.min_stay_nights && accommodation.min_stay_nights > 1 && (
              <Text style={styles.minStay}>
                📅 Min {accommodation.min_stay_nights} nights
              </Text>
            )}
          </View>
        </View>

        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <View style={styles.amenities}>
            <Text style={styles.amenitiesTitle}>Amenities:</Text>
            <View style={styles.amenitiesList}>
              {accommodation.amenities.slice(0, 4).map((amenity, index) => (
                <View key={index} style={styles.amenity}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
              {accommodation.amenities.length > 4 && (
                <Text style={styles.moreAmenities}>
                  +{accommodation.amenities.length - 4} more
                </Text>
              )}
            </View>
          </View>
        )}

        {accommodation.availability_start && accommodation.availability_end && (
          <View style={styles.availability}>
            <Text style={styles.availabilityTitle}>Available:</Text>
            <Text style={styles.availabilityDates}>
              {new Date(accommodation.availability_start).toLocaleDateString()} - 
              {new Date(accommodation.availability_end).toLocaleDateString()}
            </Text>
          </View>
        )}

        {accommodation.booking_url && accommodation.is_available && (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => onBook?.(accommodation)}
          >
            <Text style={styles.bookButtonText}>📅 Book Now</Text>
          </TouchableOpacity>
        )}

        {!accommodation.is_available && (
          <View style={styles.unavailableButton}>
            <Text style={styles.unavailableText}>Currently Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
const s
tyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666666',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 12,
  },
  rating: {
    fontSize: 12,
    color: '#666666',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  platform: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2196F3',
    textTransform: 'capitalize',
  },
  accommodationType: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
  },
  guests: {
    fontSize: 12,
    color: '#666666',
  },
  minStay: {
    fontSize: 12,
    color: '#666666',
  },
  amenities: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenity: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 11,
    color: '#2196F3',
  },
  moreAmenities: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  availability: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  availabilityTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  availabilityDates: {
    fontSize: 12,
    color: '#666666',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unavailableButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 14,
    color: '#999999',
  },
});