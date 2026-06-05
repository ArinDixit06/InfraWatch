import React from 'react';
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportCard({ report, cardRef }) {
  if (!report) return null;

  const {
    damage_type,
    severity,
    severity_reasoning,
    estimated_size,
    risk_narrative,
    context_observations,
    authority_name,
    authority_reasoning,
    complaint_letter_english,
    complaint_letter_hindi,
    helpline_number,
    twitter_handle,
    disclaimer,
    imageUri,
    timestamp
  } = report;

  // Severity style configuration
  const getSeverityStyle = (sev) => {
    const s = sev ? sev.toUpperCase() : "MEDIUM";
    switch (s) {
      case "LOW":
        return {
          bg: '#065f46',
          text: '#34d399',
          border: '#059669'
        };
      case "MEDIUM":
        return {
          bg: '#78350f',
          text: '#fbbf24',
          border: '#d97706'
        };
      case "HIGH":
        return {
          bg: '#7c2d12',
          text: '#fb923c',
          border: '#ea580c'
        };
      case "CRITICAL":
        return {
          bg: '#881337',
          text: '#f43f5e',
          border: '#e11d48'
        };
      default:
        return {
          bg: '#334155',
          text: '#94a3b8',
          border: '#475569'
        };
    }
  };

  const sevStyle = getSeverityStyle(severity);
  const formattedDate = new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <View 
      ref={cardRef} 
      style={styles.cardContainer}
      collapsable={false} // Ensure Android doesn't optimize it away for screenshotting
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="eye" size={16} color="#a855f7" />
          </View>
          <Text style={styles.brandName}>InfraWatch</Text>
        </View>
        <Text style={styles.cardDate}>{formattedDate}</Text>
      </View>

      {/* Location Badge */}
      {report.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color="#a855f7" style={{ marginRight: 6 }} />
          <Text style={styles.locationText} numberOfLines={1}>{report.location}</Text>
        </View>
      )}

      {/* Image Thumbnail */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.reportImage} resizeMode="cover" />
        </View>
      )}

      {/* Badges and Core Info */}
      <View style={styles.contentSection}>
        <View style={styles.badgeRow}>
          <View style={[styles.severityBadge, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
            <Text style={[styles.severityText, { color: sevStyle.text }]}>{severity}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{damage_type}</Text>
          </View>
        </View>

        {/* Severity Reasoning */}
        <Text style={styles.reasoningText}>{severity_reasoning}</Text>

        <View style={styles.divider} />

        {/* Details grid */}
        <View style={styles.infoGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Estimated Size</Text>
            <Text style={styles.gridValue}>{estimated_size}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Observations</Text>
            <Text style={styles.gridValue}>{context_observations}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Risk Narrative */}
        <View style={styles.narrativeSection}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <Text style={styles.narrativeText}>{risk_narrative}</Text>
        </View>

        <View style={styles.divider} />

        {/* Assigned Authority */}
        <View style={styles.authoritySection}>
          <Text style={styles.sectionTitle}>Assigned Authority</Text>
          <View style={styles.authorityCard}>
            <Text style={styles.authorityName}>{authority_name}</Text>
            <Text style={styles.authorityReasoning}>{authority_reasoning}</Text>
            
            <View style={styles.contactRow}>
              {helpline_number && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>{helpline_number}</Text>
                </View>
              )}
              {report.authority_email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>{report.authority_email}</Text>
                </View>
              )}
              {twitter_handle && (
                <View style={styles.contactItem}>
                  <Ionicons name="logo-twitter" size={14} color="#94a3b8" />
                  <Text style={styles.contactText}>{twitter_handle}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Generated by InfraWatch · Powered by Gemini</Text>
          <Text style={styles.disclaimerText}>{disclaimer}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  typeBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reasoningText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  narrativeSection: {
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  narrativeText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  authoritySection: {
    marginVertical: 4,
  },
  authorityCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  authorityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a855f7',
    marginBottom: 4,
  },
  authorityReasoning: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#33415550',
  },
  locationText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
});
