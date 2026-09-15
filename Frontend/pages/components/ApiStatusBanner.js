import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { checkHealth, checkReady, getApiBase, ApiError } from '../../src/api-calls';
import { colors } from '../../src/theme';

/**
 * Compact banner so reviewers can see whether the scoring API is reachable.
 * Reflects /health and /ready only.
 */
export default function ApiStatusBanner({ refreshKey = 0 }) {
  const [state, setState] = useState({
    loading: true,
    health: null,
    ready: null,
    error: null,
  });

  const probe = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const health = await checkHealth();
      let ready = null;
      try {
        ready = await checkReady();
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          ready = { status: 'not_ready' };
        } else {
          throw err;
        }
      }
      setState({ loading: false, health, ready, error: null });
    } catch (err) {
      setState({
        loading: false,
        health: null,
        ready: null,
        error: err.message || 'API unreachable',
      });
    }
  };

  useEffect(() => {
    probe();
  }, [refreshKey]);

  if (state.loading) {
    return (
      <View style={[styles.banner, styles.info]}>
        <ActivityIndicator size="small" color={colors.primaryDark} />
        <Text style={styles.text}>Checking API at {getApiBase()}…</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <TouchableOpacity style={[styles.banner, styles.bad]} onPress={probe}>
        <Text style={styles.textBad}>
          API offline: {state.error} (tap to retry)
        </Text>
      </TouchableOpacity>
    );
  }

  const readyOk = state.ready && state.ready.status === 'ready';
  return (
    <TouchableOpacity
      style={[styles.banner, readyOk ? styles.ok : styles.warn]}
      onPress={probe}
    >
      <Text style={readyOk ? styles.textOk : styles.textWarn}>
        API {state.health?.status || 'ok'}
        {readyOk
          ? ` · ready (${state.ready.regions_loaded} regions)`
          : ' · indexes not ready; call /init or wait for AUTO_INIT'}
        {' · '}
        {getApiBase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  info: { backgroundColor: colors.primarySoft },
  ok: { backgroundColor: colors.successSoft },
  warn: { backgroundColor: colors.warningSoft },
  bad: { backgroundColor: colors.dangerSoft },
  text: { color: colors.text, fontSize: 12, flex: 1 },
  textOk: { color: colors.success, fontSize: 12, flex: 1 },
  textWarn: { color: colors.scoreMid, fontSize: 12, flex: 1 },
  textBad: { color: colors.danger, fontSize: 12, flex: 1 },
});
