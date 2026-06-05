import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const getApiKey = () => {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
};

// Rich Fallback authority map grouped by city
export const authorityMap = {
  delhi: {
    colony: { name: "MCD (Municipal Corporation of Delhi)", helpline: "155305", email: "commissioner@mcd.nic.in", twitter: "@MCD_Delhi" },
    arterial: { name: "PWD Delhi (Public Works Department)", helpline: "1908", email: "complaint@pwddelhi.gov.in", twitter: "@PWD_Delhi" },
    highway: { name: "NHAI (National Highways Authority of India)", helpline: "1033", email: "tis@nhai.org", twitter: "@NHAI_Official" },
    bridge: { name: "PWD Delhi (Bridges Division)", helpline: "1908", email: "complaint@pwddelhi.gov.in", twitter: "@PWD_Delhi" },
    footbridge: { name: "MCD (Footbridge Division)", helpline: "155305", email: "commissioner@mcd.nic.in", twitter: "@MCD_Delhi" },
  },
  gurugram: {
    colony: { name: "MCG (Municipal Corporation of Gurugram)", helpline: "18001801817", email: "commissioner@mcg.gov.in", twitter: "@MunCorpGurugram" },
    arterial: { name: "GMDA (Gurugram Metropolitan Development Authority)", helpline: "0124-2746600", email: "services.gmda@gmail.com", twitter: "@officialgmda" },
    highway: { name: "NHAI", helpline: "1033", email: "tis@nhai.org", twitter: "@NHAI_Official" },
    bridge: { name: "GMDA (Bridges & Flyovers)", helpline: "0124-2746600", email: "services.gmda@gmail.com", twitter: "@officialgmda" },
    footbridge: { name: "MCG (Infrastructure Division)", helpline: "18001801817", email: "commissioner@mcg.gov.in", twitter: "@MunCorpGurugram" },
  },
  noida: {
    colony: { name: "Noida Authority", helpline: "0120-2425025", email: "noida@noidaauthorityonline.com", twitter: "@noida_authority" },
    arterial: { name: "Noida Authority (Public Works Division)", helpline: "0120-2425025", email: "noida@noidaauthorityonline.com", twitter: "@noida_authority" },
    highway: { name: "NHAI / Yamuna Expressway Authority", helpline: "1033", email: "tis@nhai.org", twitter: "@NHAI_Official" },
    bridge: { name: "Noida Authority Bridges Dept", helpline: "0120-2425025", email: "noida@noidaauthorityonline.com", twitter: "@noida_authority" },
    footbridge: { name: "Noida Authority Urban Services", helpline: "0120-2425025", email: "noida@noidaauthorityonline.com", twitter: "@noida_authority" },
  },
  generic: {
    colony: { name: "Local Municipal Corporation", helpline: "155305", email: "complaints@municipal.gov.in", twitter: "@MCD_Delhi" },
    arterial: { name: "Public Works Department (PWD)", helpline: "1908", email: "complaint@pwddelhi.gov.in", twitter: "@PWD_Delhi" },
    highway: { name: "NHAI", helpline: "1033", email: "tis@nhai.org", twitter: "@NHAI_Official" },
    bridge: { name: "PWD / NHAI Bridges", helpline: "1033", email: "tis@nhai.org", twitter: "@PWD_Delhi" },
    footbridge: { name: "Local Municipal Body", helpline: "155305", email: "complaints@municipal.gov.in", twitter: "@MCD_Delhi" },
  }
};

const getCityFallbackKey = (userLocation) => {
  if (!userLocation) return 'generic';
  const loc = userLocation.toLowerCase();
  if (loc.includes('gurugram') || loc.includes('gurgaon') || loc.includes('haryana')) {
    return 'gurugram';
  } else if (loc.includes('delhi') || loc.includes('new delhi')) {
    return 'delhi';
  } else if (loc.includes('noida') || loc.includes('greater noida') || loc.includes('up')) {
    return 'noida';
  }
  return 'generic';
};

// Convert URI to base64 string (cross-platform helper)
const uriToBase64 = async (uri) => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Native platforms
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  }
};

export const analyzeInfrastructureDamage = async (imageUri, infraType, roadClass, userLocation = 'Delhi, India') => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error("Missing Gemini API Key. Please configure the EXPO_PUBLIC_GEMINI_API_KEY in your .env file.");
  }

  // 1. Convert image uri to base64
  let base64Data;
  try {
    base64Data = await uriToBase64(imageUri);
  } catch (error) {
    console.error("Failed to read image file: ", error);
    throw new Error("Could not read the captured image. Please try again.");
  }

  // 2. Initialize the Gemini API client
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `You are an infrastructure safety analyst for Indian roads and bridges.
Analyze the provided image and the user-specified infrastructure type: ${infraType} on a ${roadClass} road.
The user is located in: ${userLocation}.

Based on this location, identify the correct local government body/municipal authority (e.g. Municipal Corporation of Delhi (MCD) or PWD Delhi for Delhi, Municipal Corporation of Gurugram (MCG) or GMDA for Gurugram, Municipal Corporation of Faridabad (MCF), Noida Authority for Noida, Greater Noida Authority, Ghaziabad Municipal Corporation (GMC), etc.).
Identify the official email address, helpline number, and official Twitter/X handle for this authority. If you aren't sure of the exact email, construct a realistic official email (e.g., commissioner@mcg.gov.in, commissioner@mcd.nic.in, or similar).

Respond ONLY with a valid JSON object in this exact schema. Do not return markdown, do not wrap in backticks or code blocks. Just valid JSON:
{
  "damage_type": "string — specific damage name e.g. 'deep pothole with edge cracking'",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "severity_reasoning": "string — 1 sentence why",
  "estimated_size": "string — approximate dimensions if visible, else 'not determinable'",
  "risk_narrative": "string — 2 sentences: who is at risk and when",
  "context_observations": "string — what surroundings suggest e.g. school zone, market, highway",
  "authority_name": "string — exact authority name e.g. 'Municipal Corporation of Gurugram (MCG)'",
  "authority_reasoning": "string — 1 sentence why this authority was selected for this location",
  "authority_email": "string — official complaint email address of the authority, e.g. commissioner@mcg.gov.in",
  "complaint_email_subject": "string — concise email subject line including damage type and location",
  "complaint_letter_english": "string — full formal complaint letter/email body addressed to the authority, including details of the damage and location",
  "complaint_letter_hindi": "string — same letter/email body in Hindi",
  "helpline_number": "string — relevant helpline contact number",
  "twitter_handle": "string — official Twitter/X handle to tag e.g. @gurugrammc or @MCD_Delhi",
  "disclaimer": "This is an AI-assisted visual observation, not a certified engineering assessment. Please contact a qualified engineer for structural evaluations."
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Analyze this image of a ${infraType} on a ${roadClass} at location ${userLocation}.` },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const responseText = result.response.text();
    console.log("Gemini raw response: ", responseText);

    // Clean response text just in case Gemini wrapped it in markdown code block
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedData = JSON.parse(cleanedText);

    // Validate and fill missing fields using local logic fallback
    const cityKey = getCityFallbackKey(userLocation);
    const cityMap = authorityMap[cityKey] || authorityMap.generic;
    const fallbackInfo = cityMap[roadClass] || cityMap.colony || authorityMap.generic.colony;
    
    return {
      damage_type: parsedData.damage_type || `${infraType} damage`,
      severity: parsedData.severity || "MEDIUM",
      severity_reasoning: parsedData.severity_reasoning || "Visible structural wearing on road surface.",
      estimated_size: parsedData.estimated_size || "Not determinable",
      risk_narrative: parsedData.risk_narrative || "May cause vehicle damage or compromise safety if unaddressed.",
      context_observations: parsedData.context_observations || "Public road environment.",
      authority_name: parsedData.authority_name || fallbackInfo.name,
      authority_reasoning: parsedData.authority_reasoning || "Based on road classification and city location.",
      authority_email: parsedData.authority_email || fallbackInfo.email,
      complaint_email_subject: parsedData.complaint_email_subject || `Urgent Attention: Infrastructure Damage (${infraType}) at ${userLocation}`,
      complaint_letter_english: parsedData.complaint_letter_english || `To,\nThe Commissioner,\n${fallbackInfo.name}\n\nSubject: Repair required for road damage (${infraType}) at ${userLocation}\n\nDear Sir/Madam,\n\nI am writing to draw your attention to a safety hazard. There is visible road damage (${infraType}) on a ${roadClass} road at ${userLocation}.\n\nThis requires immediate inspection and repair to prevent accidents.\n\nSincerely,\nA Concerned Citizen`,
      complaint_letter_hindi: parsedData.complaint_letter_hindi || `सेवा में,\nआयुक्त महोदय,\n${fallbackInfo.name}\n\nविषय: ${userLocation} पर सड़क क्षति (${infraType}) की मरम्मत के संबंध में।\n\nमहोदय/महोदया,\n\nमैं आपका ध्यान एक सुरक्षा खतरे की ओर आकर्षित करना चाहता हूँ। ${userLocation} में ${roadClass} सड़क पर सड़क क्षति (${infraType}) दिखाई दे रही है।\n\nदुर्घटनाओं को रोकने के लिए तत्काल निरीक्षण और मरम्मत की आवश्यकता है।\n\nभवदीय,\nएक चिंतित नागरिक`,
      helpline_number: parsedData.helpline_number || fallbackInfo.helpline,
      twitter_handle: parsedData.twitter_handle || fallbackInfo.twitter,
      disclaimer: parsedData.disclaimer || "This is an AI-assisted visual observation, not a certified engineering assessment. Please contact a qualified engineer for structural evaluations.",
      imageUri: imageUri,
      location: userLocation,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Gemini API error: ", error);
    throw new Error(error.message || "Failed to analyze image with Gemini. Please try again.");
  }
};
