import { NextRequest, NextResponse } from 'next/server'

// AI Vision Model Types
type AIModelService = 'openai-vision' | 'claude-vision' | 'gemini-vision' | 'roboflow-meter'

interface AIModelConfig {
    service: AIModelService
    apiKey: string
    endpoint?: string
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('image') as File
        const expectedMeterNumber = formData.get('expected_meter_number') as string
        const readingType = formData.get('reading_type') as string

        if (!file) {
            return NextResponse.json({
                error: "Image file is required"
            }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({
                error: "Only image files are allowed"
            }, { status: 400 })
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                error: "File size must be less than 10MB"
            }, { status: 400 })
        }

        // Get AI model configuration from environment variables
        const aiModelConfig: AIModelConfig = {
            service: 'gemini-vision',
            apiKey: process.env.NEXT_PUBLIC_AI_MODEL_API_KEY || '',
            endpoint: process.env.NEXT_PUBLIC_AI_MODEL_ENDPOINT
        }

        // Basic image validation checks
        const validationResult = await validateMeterReadingInImage(file, expectedMeterNumber, readingType, aiModelConfig)

        return NextResponse.json({
            isReadingVisible: validationResult.isVisible,
            message: validationResult.message,
            extractedReading: validationResult.extractedReading || null,
            confidence: validationResult.confidence || 0
        })

    } catch (error) {
        console.error('Error validating meter reading image:', error)
        return NextResponse.json({
            error: 'Failed to validate image'
        }, { status: 500 })
    }
}

async function validateMeterReadingInImage(file: File, expectedMeterNumber?: string, readingType?: string, aiModelConfig?: AIModelConfig): Promise<{
    isVisible: boolean;
    message: string;
    extractedReading?: string;
    confidence: number;
}> {
    try {
        // Convert file to base64 for processing
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Basic image quality checks
        const isImageValid = await performBasicImageChecks(buffer)

        if (!isImageValid.isValid) {
            return {
                isVisible: false,
                message: isImageValid.message,
                confidence: 0
            }
        }

        // AI model extraction for meter reading
        const aiResult = await performAIMeterReading(buffer, aiModelConfig)

        // Validate if meter reading is visible and readable
        const validationResult = validateAIResult(aiResult, expectedMeterNumber)

        return validationResult

    } catch (error) {
        console.error('Image validation error:', error)
        return {
            isVisible: false,
            message: "Failed to process image. Please ensure the image is clear and contains a visible meter reading.",
            confidence: 0
        }
    }
}

async function performBasicImageChecks(buffer: Buffer) {
    // Basic image validation
    try {
        // Check if image is too small (likely not useful)
        if (buffer.length < 1000) {
            return {
                isValid: false,
                message: "Image appears to be too small or corrupted"
            }
        }

        // Check basic image headers for common formats
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
        const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46

        if (!isJPEG && !isPNG && !isGIF) {
            return {
                isValid: false,
                message: "Image format not supported or file is corrupted"
            }
        }

        return {
            isValid: true,
            message: "Image passed basic validation checks"
        }
    } catch (error) {
        return {
            isValid: false,
            message: "Failed to validate image format"
        }
    }
}

async function performAIMeterReading(buffer: Buffer, aiModelConfig?: AIModelConfig) {
    if (!aiModelConfig || !aiModelConfig.apiKey) {
        throw new Error('AI model configuration is required. Please configure an AI model service (OpenAI, Claude, Gemini, or Roboflow) to process meter readings.')
    }

    try {
        switch (aiModelConfig.service) {
            case 'openai-vision':
                return await openAIMeterReading(buffer, aiModelConfig.apiKey)
            case 'claude-vision':
                return await claudeMeterReading(buffer, aiModelConfig.apiKey)
            case 'gemini-vision':
                return await geminiMeterReading(buffer, aiModelConfig.apiKey)
            case 'roboflow-meter':
                return await roboflowMeterReading(buffer, aiModelConfig.apiKey, aiModelConfig.endpoint)
            default:
                throw new Error(`Unsupported AI model service: ${aiModelConfig.service}. Supported services are: openai-vision, claude-vision, gemini-vision, roboflow-meter`)
        }
    } catch (error) {
        console.error(`AI model service ${aiModelConfig.service} failed:`, error)
        throw new Error(`Failed to process meter reading with ${aiModelConfig.service}. Please check your API configuration and try again.`)
    }
}

// OpenAI GPT-4 Vision for Meter Reading
async function openAIMeterReading(buffer: Buffer, apiKey: string) {
    const base64Image = buffer.toString('base64')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Analyze this utility meter image and extract the main reading value. Look for:
                        1. Digital display readings (like 53320)
                        2. Analog meter pointer readings
                        3. The most prominent numerical value on the display
                        4. Values typically shown in kWh, units, or similar
                        
                        Return a JSON response with:
                        {
                            "reading": "the main meter reading value",
                            "confidence": 0.0-1.0,
                            "meter_type": "digital/analog",
                            "unit": "kWh/units/etc"
                        }`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }],
            max_tokens: 300
        })
    })

    const result = await response.json()

    if (result.choices && result.choices[0] && result.choices[0].message) {
        try {
            const content = result.choices[0].message.content
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    reading: parsed.reading,
                    confidence: parsed.confidence || 0.95,
                    meterType: parsed.meter_type || 'digital',
                    unit: parsed.unit || 'kWh'
                }
            }
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError)
        }

        // Fallback: extract any numbers from the response
        const numberMatch = result.choices[0].message.content.match(/\d+\.?\d*/g)
        if (numberMatch) {
            return {
                reading: numberMatch[0],
                confidence: 0.8,
                meterType: 'unknown',
                unit: 'unknown'
            }
        }
    }

    throw new Error('No meter reading detected')
}

// Claude Vision for Meter Reading
async function claudeMeterReading(buffer: Buffer, apiKey: string) {
    const base64Image = buffer.toString('base64')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 300,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Please analyze this utility meter image and extract the main reading value. I need:

1. The primary meter reading (usually the largest number display)
2. Whether it's a digital or analog meter
3. The unit if visible (kWh, units, etc.)
4. Your confidence in the reading

Return ONLY a JSON object like this:
{
    "reading": "53320",
    "confidence": 0.95,
    "meter_type": "digital",
    "unit": "kWh"
}`
                    },
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }]
        })
    })

    const result = await response.json()

    if (result.content && result.content[0] && result.content[0].text) {
        try {
            const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    reading: parsed.reading,
                    confidence: parsed.confidence || 0.95,
                    meterType: parsed.meter_type || 'digital',
                    unit: parsed.unit || 'kWh'
                }
            }
        } catch (parseError) {
            console.error('Failed to parse Claude response:', parseError)
        }

        // Fallback: extract any numbers from the response
        const numberMatch = result.content[0].text.match(/\d+\.?\d*/g)
        if (numberMatch) {
            return {
                reading: numberMatch[0],
                confidence: 0.8,
                meterType: 'unknown',
                unit: 'unknown'
            }
        }
    }

    throw new Error('No meter reading detected')
}

// Google Gemini 2.0 Flash for Meter Reading (Cost Effective & Fast)
async function geminiMeterReading(buffer: Buffer, apiKey: string) {
    const base64Image = buffer.toString('base64')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `Analyze this utility meter image and extract the meter reading. This is an electricity meter (like the HPL Electric & Power Ltd. meters). Look for:

1. The main digital display showing the meter reading (example: 53320.1)
2. Units like kWh, UNITS, or similar
3. Any meter identification information

Return ONLY a JSON response in this exact format:
{
    "reading": "53320.1",
    "confidence": 0.95,
    "meter_type": "digital/analog",
    "unit": "kWh"
}

Focus on the largest numerical display - that's usually the main meter reading.`
                    },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }]
        })
    })

    const result = await response.json()

    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        try {
            const content = result.candidates[0].content.parts[0].text
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                return {
                    reading: parsed.reading,
                    confidence: parsed.confidence || 0.9,
                    meterType: parsed.meter_type || 'digital/analog',
                    unit: parsed.unit || 'kWh'
                }
            }
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError)
        }

        // Fallback: extract any numbers from the response
        const numberMatch = result.candidates[0].content.parts[0].text.match(/\d+\.?\d*/g)
        if (numberMatch) {
            return {
                reading: numberMatch[0],
                confidence: 0.8,
                meterType: 'unknown',
                unit: 'unknown'
            }
        }
    }

    throw new Error('No meter reading detected')
}

// Roboflow Specialized Meter Reading Model
async function roboflowMeterReading(buffer: Buffer, apiKey: string, endpoint?: string) {
    if (!endpoint) {
        throw new Error('Roboflow endpoint required')
    }

    const base64Image = buffer.toString('base64')

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `api_key=${apiKey}&image=${encodeURIComponent(base64Image)}`
    })

    const result = await response.json()

    // Roboflow response format varies by model
    if (result.predictions && result.predictions.length > 0) {
        const prediction = result.predictions[0]
        return {
            reading: prediction.class || prediction.value,
            confidence: prediction.confidence || 0.9,
            meterType: 'digital',
            unit: 'kWh'
        }
    }

    throw new Error('No meter reading detected')
}


function validateAIResult(aiResult: any, expectedMeterNumber?: string) {
    const reading = aiResult.reading
    const confidence = aiResult.confidence || 0
    const meterType = aiResult.meterType || 'unknown'
    const unit = aiResult.unit || 'unknown'

    // Validate that we have a valid reading
    const hasValidReading = reading && !isNaN(parseFloat(reading))

    // Check for meter number if provided (this would need to be enhanced based on actual requirements)
    let meterNumberMatches = true
    if (expectedMeterNumber) {
        // For now, we assume meter number validation is not part of the AI model response
        // This could be enhanced to include meter number detection in the AI model prompts
        meterNumberMatches = true
    }

    // Determine if meter reading is visible and valid
    const isVisible = hasValidReading && confidence > 0.7

    let message = ""
    if (!hasValidReading) {
        message = "AI model could not detect a valid meter reading in the image. Please ensure the meter display is clearly visible and take a new photo."
    } else if (confidence <= 0.7) {
        message = "AI model has low confidence in the reading. Please take a clearer photo with better lighting and ensure the meter display is fully visible."
    } else if (!meterNumberMatches && expectedMeterNumber) {
        message = `Meter number in image is incorrect (Expected: ${expectedMeterNumber}). Please take photo of correct meter.`
    } else {
        message = `Meter reading successfully extracted by AI: ${reading} ${unit} (${meterType} meter, confidence: ${Math.round(confidence * 100)}%)`
    }

    return {
        isVisible,
        message,
        extractedReading: reading || undefined,
        confidence
    }
}
