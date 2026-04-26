import mongoose from 'mongoose';
import Product from './models/product/product.js';
import Category from './models/category/category.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkIPhone() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await Product.find({ name: /I\s*phone/i }).populate('category').lean();
        
        if (products.length === 0) {
            console.log('No products found matching iPhone');
        } else {
            console.log(`Found ${products.length} products matching "iPhone":`);
            products.forEach(p => {
                console.log('-----------------------------------');
                console.log('Product Name:', p.name);
                console.log('  ID:', p._id);
                console.log('  isListed:', p.isListed);
                console.log('  isBlocked:', p.isBlocked);
                console.log('  Category:', p.category?.name || 'N/A');
                console.log('  Category ID:', p.category?._id || 'N/A');
                console.log('  Category isUnlisted:', p.category?.isUnlisted ?? 'N/A');
                console.log('  Variants Count:', p.variants?.length || 0);
                
                if (p.variants && p.variants.length > 0) {
                    const activeVariants = p.variants.filter(v => !v.isDeleted);
                    console.log(`  Active Variants (${activeVariants.length}):`);
                    activeVariants.forEach((v, i) => {
                        console.log(`    ${i+1}: color=${v.color}, RAM=${v.ram}, storage=${v.storage}, price=${v.price}, stock=${v.stock}`);
                    });
                    
                    const deletedVariants = p.variants.filter(v => v.isDeleted);
                    if (deletedVariants.length > 0) {
                        console.log(`  Deleted Variants (${deletedVariants.length}):`);
                        deletedVariants.forEach((v, i) => {
                            console.log(`    ${i+1}: color=${v.color}, price=${v.price}`);
                        });
                    }
                } else {
                    console.log('  No variants found for this product.');
                }
                
                // Reason for missing in shop
                let reasons = [];
                if (!p.isListed) reasons.push("Product is unlisted (isListed: false)");
                if (p.isBlocked) reasons.push("Product is blocked (isBlocked: true)");
                if (p.category?.isUnlisted) reasons.push("Category is unlisted");
                if (p.variants && p.variants.length > 0 && !p.variants.some(v => !v.isDeleted)) reasons.push("All variants are soft-deleted");
                
                if (reasons.length > 0) {
                    console.log('\n  MISSING FROM SHOP REASONS:');
                    reasons.forEach(r => console.log('  - ' + r));
                } else {
                    console.log('\n  STATUS: Should be visible in shop.');
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkIPhone();
