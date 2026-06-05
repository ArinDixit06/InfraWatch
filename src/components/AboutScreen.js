import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com').catch(err => {
      console.error("Failed to open URL:", err);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="eye" size={48} color="#a855f7" />
        </View>
        <Text style={styles.appName}>InfraWatch</Text>
        <Text style={styles.appVersion}>Version 1.0.0 (Beta)</Text>
      </View>

      {/* Concept Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>The Problem & Solution</Text>
        <Text style={styles.cardText}>
          Delhi has over 1,400 km of roads maintained by three different agencies. When you hit a pothole, you don't know if it's MCD, PWD, or NHAI — so most complaints go nowhere.
        </Text>
        <Text style={styles.cardTextHighlight}>
          InfraWatch uses Gemini Vision to classify the damage, identify the right authority, and write the complaint for you in under 10 seconds.
        </Text>
      </View>

      {/* Features List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Features</Text>
        
        <View style={styles.featureItem}>
          <Ionicons name="sparkles" size={16} color="#a855f7" style={styles.featureIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>Gemini Vision AI Analysis</Text>
            <Text style={styles.featureDesc}>Get instant damage category detection, severity assessment, and risk narrative generation.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="git-pull-request" size={16} color="#a855f7" style={styles.featureIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>Automatic Authority Assignment</Text>
            <Text style={styles.featureDesc}>Matches municipal jurisdictions (MCD, PWD, NHAI) based on road classifications.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="document-text" size={16} color="#a855f7" style={styles.featureIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>Dual-Language Complaints</Text>
            <Text style={styles.featureDesc}>Generates formatted, ready-to-send formal complaints in both English and Hindi.</Text>
          </View>
        </View>
      </View>

      {/* GitHub Section */}
      <TouchableOpacity style={styles.githubButton} onPress={handleOpenGitHub}>
        <Ionicons name="logo-github" size={20} color="#ffffff" style={{ marginRight: 10 }} />
        <Text style={styles.githubButtonText}>View Source on GitHub</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Safety Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          InfraWatch is an AI-assisted visual observation tool, not a certified engineering assessment platform. AI-generated analyses should not replace professional structural evaluations. In emergency situations with active safety hazards, please contact civil services immediately.
        </Text>
      </View>

      <Text style={styles.footerCredits}>Developed with ❤️ using Expo 54 & Gemini AI</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1e293b60',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  appVersion: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b40',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardTextHighlight: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '600',
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  featureDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  githubButton: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  githubButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerBox: {
    backgroundColor: '#1e293b1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    width: '100%',
    maxWidth: 500,
    marginBottom: 24,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  footerCredits: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
  },
});
