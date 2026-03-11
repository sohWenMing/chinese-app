// list-models.js
// Lists available Gemini models

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error);
      process.exit(1);
    }
    
    console.log('\n✅ Available Gemini Models:\n');
    console.log('='.repeat(80));
    
    data.models.forEach(model => {
      console.log(`\n📌 ${model.name}`);
      console.log(`   Display: ${model.displayName || 'N/A'}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      if (model.supportedGenerationMethods) {
        console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    process.exit(1);
  }
}

listModels();
