# AI Meter Reading Setup Guide

This comprehensive guide explains how to set up and configure AI models for intelligent meter reading extraction.

## Overview

The system now uses advanced AI vision models instead of traditional OCR to extract meter readings. These models understand the context of utility meters and provide more accurate results.

## Quick Start

1. Choose an AI model service (OpenAI GPT-4 Vision recommended)
2. Get API credentials
3. Configure environment variables
4. Test with sample meter images

## Environment Configuration

Create or update your `.env.local` file:

```env
# AI Model Configuration
AI_MODEL_SERVICE=openai-vision
AI_MODEL_API_KEY=your_api_key_here
AI_MODEL_ENDPOINT=optional_custom_endpoint
```

## Supported AI Models

### OpenAI GPT-4 Vision (Recommended)

**Best for**: General meter reading with highest accuracy

```env
AI_MODEL_SERVICE=openai-vision
AI_MODEL_API_KEY=sk-your-openai-api-key
```

**Setup Steps:**
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy the key to your environment variables

**Pricing**: ~$0.01 per image

### Claude Vision (Anthropic)

**Best for**: Complex meter interpretations and cost-effectiveness

```env
AI_MODEL_SERVICE=claude-vision
AI_MODEL_API_KEY=sk-ant-your-anthropic-key
```

**Setup Steps:**
1. Go to https://console.anthropic.com/
2. Create API key
3. Add to environment variables

**Pricing**: ~$0.008 per image

### Google Gemini Vision

**Best for**: Google ecosystem integration and budget-conscious projects

```env
AI_MODEL_SERVICE=gemini-vision
AI_MODEL_API_KEY=your-gemini-api-key
```

**Setup Steps:**
1. Go to https://aistudio.google.com/app/apikey
2. Create API key
3. Add to environment variables

**Pricing**: ~$0.0025 per image

### Roboflow Specialized Models

**Best for**: Custom-trained meter reading models

```env
AI_MODEL_SERVICE=roboflow-meter
AI_MODEL_API_KEY=your-roboflow-key
AI_MODEL_ENDPOINT=https://detect.roboflow.com/your-model/1
```

**Setup Steps:**
1. Train or find a meter reading model on Roboflow
2. Get API key and model endpoint
3. Configure both key and endpoint

## How It Works

### Traditional OCR vs AI Models

| Feature | Traditional OCR | AI Models |
|---------|----------------|-----------|
| **Text Extraction** | Raw text only | Contextual understanding |
| **Accuracy** | 70-85% | 90-98% |
| **Meter Types** | Digital only | Digital + Analog |
| **Error Handling** | Basic | Intelligent validation |
| **Output Format** | Raw text | Structured data |

### AI Model Response Format

```json
{
  "reading": "53320",
  "confidence": 0.95,
  "meterType": "digital",
  "unit": "kWh"
}
```

### Validation Logic

The AI models provide:
- **Reading Value**: The extracted meter reading
- **Confidence Score**: 0.0-1.0 indicating certainty
- **Meter Type**: digital, analog, or unknown
- **Unit**: kWh, units, watts, etc.

## Testing

### Sample Test Images

Upload images showing:
- Clear digital displays (like 53320)
- Analog meter dials
- Smart meter LCD displays
- Multi-register meters

### Expected Results

For a clear meter image showing "53320":
```json
{
  "isReadingVisible": true,
  "message": "Meter reading successfully extracted by AI: 53320 kWh (digital meter, confidence: 95%)",
  "extractedReading": "53320",
  "confidence": 0.95
}
```

## Production Deployment

### Security Best Practices

1. **Environment Variables**: Never commit API keys to version control
2. **Key Rotation**: Regularly rotate API keys
3. **Rate Limiting**: Implement request limiting
4. **Error Handling**: Graceful fallbacks for API failures

### Performance Optimization

1. **Image Preprocessing**: Resize images to optimal size
2. **Caching**: Cache results for identical images
3. **Retry Logic**: Handle temporary API failures
4. **Monitoring**: Track accuracy and costs

### Cost Management

- **OpenAI**: Monitor usage at https://platform.openai.com/usage
- **Anthropic**: Check usage at https://console.anthropic.com/
- **Google**: View billing at https://console.cloud.google.com/

## Troubleshooting

### Common Issues

1. **"No meter reading detected"**
   - Ensure image is clear and well-lit
   - Check that meter display is fully visible
   - Try a different angle or lighting

2. **Low confidence scores**
   - Improve image quality
   - Ensure meter is in focus
   - Remove obstructions from view

3. **API errors**
   - Verify API key is correct
   - Check service status
   - Implement retry logic

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_AI_METER_READING=true
```

## Migration from OCR

If migrating from the old OCR system:

1. Update environment variables:
   - `OCR_SERVICE` → `AI_MODEL_SERVICE`
   - `OCR_API_KEY` → `AI_MODEL_API_KEY`
   - `OCR_ENDPOINT` → `AI_MODEL_ENDPOINT`

2. The API interface remains the same
3. Response format is backward compatible
4. Improved accuracy and reliability

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation for your chosen service
3. Contact support with specific error messages

---

**Ready to use!** Your meter reading system now uses advanced AI models for superior accuracy and reliability.
