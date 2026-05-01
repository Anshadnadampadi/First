import Offer from "../../models/offer/offer.js";

export const createOfferService = async (data) => {
    let {
        name,
        type,
        discountType,
        discountValue,
        productId,
        categoryId,
        expiryDate
    } = data;

    //  Name
    if (!name || name.trim().length < 3) {
        throw new Error("Offer name must be at least 3 characters");
    }

    // Type
    if (!['Product', 'Category'].includes(type)) {
        throw new Error("Invalid offer type");
    }

    //  Discount Type
    if (!['percentage', 'fixed'].includes(discountType)) {
        throw new Error("Invalid discount type");
    }

    // Discount Value
    discountValue = Number(discountValue);
    if (!discountValue || discountValue <= 0) {
        throw new Error("Discount value must be greater than 0");
    }

    if (discountType === 'percentage' && discountValue > 99) {
        throw new Error("Percentage discount cannot exceed 99%");
    }

    //  Association
    if (type === 'Product' && !productId) {
        throw new Error("Product must be selected for Product Offer");
    }
    if (type === 'Category' && !categoryId) {
        throw new Error("Category must be selected for Category Offer");
    }

    //  Expiry
    const expiry = new Date(expiryDate);
    expiry.setHours(23, 59, 59, 999);
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
        throw new Error("Expiry date must be in the future");
    }

    //  Duplicate Name Check (Case-insensitive)
    const duplicateName = await Offer.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (duplicateName) {
        throw new Error("An offer with this name already exists");
    }

    //  Overlap Check (One active offer per product/category)
    const overlapFilter = { isActive: true };
    if (type === 'Product') {
        overlapFilter.productId = productId;
    } else {
        overlapFilter.categoryId = categoryId;
    }

    const existingOffer = await Offer.findOne(overlapFilter);
    if (existingOffer) {
        const target = type === 'Product' ? "this product" : "this category";
        throw new Error(`An active offer is already running for ${target}`);
    }

    return await Offer.create({
        name: name.trim(),
        type,
        discountType,
        discountValue,
        productId: type === 'Product' ? (productId || null) : null,
        categoryId: type === 'Category' ? (categoryId || null) : null,
        expiryDate: expiry
    });
};

export const getOffersService = async (query = {}) => {
    const { search = "", page = 1, limit = 6 } = query;
    const filter = {
        name: { $regex: search, $options: "i" }
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [offers, totalOffers] = await Promise.all([
        Offer.find(filter)
            .populate('productId', 'name')
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Offer.countDocuments(filter)
    ]);

    return {
        offers,
        totalPages: Math.ceil(totalOffers / limit),
        totalOffers,
        currentPage: Number(page)
    };
};

export const updateOfferService = async (id, data) => {
    const offer = await Offer.findById(id);
    if (!offer) throw new Error("Offer not found");

    let {
        name,
        type,
        discountType,
        discountValue,
        productId,
        categoryId,
        expiryDate
    } = data;

    if (name) offer.name = name.trim();
    if (type) offer.type = type;
    if (discountType) offer.discountType = discountType;
    if (discountValue) offer.discountValue = Number(discountValue);
    
    if (type === 'Product') {
        offer.productId = productId || null;
        offer.categoryId = null;
    } else if (type === 'Category') {
        offer.categoryId = categoryId || null;
        offer.productId = null;
    }

    // Duplicate Checks for Update
    if (name) {
        const duplicateName = await Offer.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: id }
        });
        if (duplicateName) throw new Error("An offer with this name already exists");
    }

    // Overlap Check for Update (If changing product/category or making it active)
    const currentType = type || offer.type;
    const currentProductId = productId || offer.productId;
    const currentCategoryId = categoryId || offer.categoryId;
    
    const overlapFilter = { 
        isActive: true, 
        _id: { $ne: id }
    };
    
    if (currentType === 'Product' && currentProductId) {
        overlapFilter.productId = currentProductId;
    } else if (currentType === 'Category' && currentCategoryId) {
        overlapFilter.categoryId = currentCategoryId;
    }

    if (overlapFilter.productId || overlapFilter.categoryId) {
        const existingOffer = await Offer.findOne(overlapFilter);
        if (existingOffer) {
            const target = currentType === 'Product' ? "this product" : "this category";
            throw new Error(`An active offer is already running for ${target}`);
        }
    }

    if (expiryDate) {
        const expiry = new Date(expiryDate);
        expiry.setHours(23, 59, 59, 999);
        offer.expiryDate = expiry;
    }

    await offer.save();
    return offer;
};

export const toggleOfferStatusService = async (id) => {
    const offer = await Offer.findById(id);
    if (!offer) throw new Error("Offer not found");

    if (!offer.isActive) {
        // We are enabling it, so check for overlaps
        const overlapFilter = { 
            isActive: true, 
            _id: { $ne: id }
        };
        if (offer.type === 'Product') overlapFilter.productId = offer.productId;
        else overlapFilter.categoryId = offer.categoryId;

        const existing = await Offer.findOne(overlapFilter);
        if (existing) {
            const target = offer.type === 'Product' ? "product" : "category";
            throw new Error(`Cannot enable. Another active offer exists for this ${target}.`);
        }
    }

    offer.isActive = !offer.isActive;
    await offer.save();
    return offer;
}

export const deleteOfferService = async (id) => {
    const offer = await Offer.findById(id);
    if (!offer) throw new Error("Offer not found");

    await Offer.findByIdAndDelete(id);
    return true;
};
