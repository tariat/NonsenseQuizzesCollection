import React, { useState, useMemo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { gameColors } from '../constants/colors';

interface OptimizedImageProps {
  source: any;
  style?: ImageStyle | ImageStyle[];
  placeholderStyle?: ViewStyle;
  showLoader?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const OptimizedImage = React.memo<OptimizedImageProps>(function OptimizedImage({
  source,
  style,
  placeholderStyle,
  showLoader = true,
  resizeMode = 'contain'
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const combinedStyle = useMemo(() => [
    styles.image,
    style
  ], [style]);

  const placeholderStyles = useMemo(() => [
    styles.placeholder,
    combinedStyle,
    placeholderStyle
  ], [combinedStyle, placeholderStyle]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={placeholderStyles}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={source}
        style={combinedStyle}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // 성능 최적화 속성들
        fadeDuration={200}
        progressiveRenderingEnabled={true}
        cache="force-cache"
      />
      
      {loading && showLoader && (
        <View style={[styles.loadingOverlay, combinedStyle]}>
          <ActivityIndicator 
            size="small" 
            color={gameColors.primary.solid}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    // 기본 이미지 스타일
  },
  placeholder: {
    backgroundColor: gameColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: gameColors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    backgroundColor: gameColors.gray[300],
    borderRadius: 12,
  },
});

export default OptimizedImage;