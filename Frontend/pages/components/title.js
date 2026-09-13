import { Text, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import * as React from 'react';
import { colors } from '../../src/theme';

/**
 * Brand wordmark. Falls back to system font if the Bodoni file fails to load
 * (common on web until fonts finish).
 */
export default class Title extends React.Component {
  constructor(props) {
    super(props);
    this.state = { fontsLoaded: false, fontFailed: false };
  }

  componentDidMount() {
    this.loadFonts();
  }

  async loadFonts() {
    try {
      await Font.loadAsync({
        'BodoniModa_28pt-Regular': require('../../../assets/fonts/BodoniModa_28pt-Regular.ttf'),
      });
      this.setState({ fontsLoaded: true });
    } catch {
      this.setState({ fontFailed: true });
    }
  }

  render() {
    const useCustom = this.state.fontsLoaded && !this.state.fontFailed;
    return (
      <Text
        style={[
          styles.title,
          useCustom ? { fontFamily: 'BodoniModa_28pt-Regular' } : null,
        ]}
      >
        PLANIT
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 42,
    letterSpacing: 2,
    color: colors.text,
    fontWeight: '600',
  },
});
