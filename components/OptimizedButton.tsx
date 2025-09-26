/**
 * 最適化されたボタンコンポーネント
 * UI応答性を向上させるための最適化を適用
 */

import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { useUIResponsiveness } from '../hooks/useOptimizedNavigation';

interface OptimizedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

const OptimizedButton: React.FC<OptimizedButtonProps> = memo(({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  loading = false,
}) => {
  const { measureTouch } = useUIResponsiveness('OptimizedButton');
  const scaleValue = useMemo(() => new Animated.Value(1), []);

  // 最適化されたプレスハンドラー
  const handlePress = useCallback(() => {
    const endMeasurement = measureTouch();
    
    // アニメーション効果
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 実際のアクション実行
    if (!disabled && !loading) {
      onPress();
    }
    
    endMeasurement();
  }, [onPress, disabled, loading, measureTouch, scaleValue]);

  // スタイルの最適化（useMemoを使用）
  const buttonStyle = useMemo(() => [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    loading && styles.loadingButton,
    style,
  ], [variant, size, disabled, loading, style]);

  const buttonTextStyle = useMemo(() => [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ], [variant, size, disabled, textStyle]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Text style={buttonTextStyle}>
          {loading ? '読み込み中...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Variant styles
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  
  // Size styles
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  
  // State styles
  disabledButton: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingButton: {
    opacity: 0.7,
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  dangerText: {
    color: 'white',
  },
  
  // Text size styles
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  disabledText: {
    color: '#9ca3af',
  },
});

export default OptimizedButton;