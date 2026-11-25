"""Database initialization and realistic demo seed data for EcoSort."""

import json
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    AwarenessArticle,
    Challenge,
    ChallengeProgress,
    CollectionCentre,
    DisposalMethod,
    User,
    WasteCategory,
    WasteItem,
    WasteRecord,
)
from app.services.eco_score import calculate_record_points, recalculate_user_score


def seed_database(db: Session, include_demo_users: bool = True) -> None:
    """Populate initial categories, items, centres, challenges, articles, and demo accounts.

    Idempotent: skips seeding if waste categories already exist.
    """
    if db.query(WasteCategory).count() > 0:
        return

    # 1. Waste Categories
    categories_data = [
        {
            "name": "Wet / Organic Waste",
            "slug": "wet-organic",
            "bin_color": "#15803D",
            "bin_label": "Green Bin (Wet / Compostable)",
            "description": "Biodegradable kitchen scraps, peels, leftovers, and garden trimmings that can be composted into nutrient-rich soil.",
            "examples": "Food scraps, vegetable peels, fruit waste, tea leaves, garden leaves",
            "icon_name": "leaf",
        },
        {
            "name": "Dry / Recyclable Waste",
            "slug": "dry-recyclable",
            "bin_color": "#0284C7",
            "bin_label": "Blue Bin (Dry / Recyclable)",
            "description": "Clean, dry materials that can be recovered and reprocessed into new products instead of going to landfills.",
            "examples": "Plastic bottles, newspapers, cardboard, metal cans, glass bottles, clean textiles",
            "icon_name": "recycle",
        },
        {
            "name": "E-Waste",
            "slug": "e-waste",
            "bin_color": "#D97706",
            "bin_label": "Amber E-Waste Drop-off",
            "description": "Discarded electrical and electronic devices containing recoverable metals as well as toxic lead, mercury, or lithium.",
            "examples": "Mobile phones, chargers, laptops, cables, power banks, keyboards",
            "icon_name": "cpu",
        },
        {
            "name": "Hazardous / Special Waste",
            "slug": "hazardous-special",
            "bin_color": "#DC2626",
            "bin_label": "Red / Special Hazardous Bin",
            "description": "Materials that pose chemical, biological, or fire hazards and must never be mixed with household wet or dry waste.",
            "examples": "Batteries, expired medicines, paint cans, CFL bulbs, household chemicals",
            "icon_name": "alert-triangle",
        },
    ]

    cat_by_slug = {}
    for c_data in categories_data:
        cat = WasteCategory(**c_data)
        db.add(cat)
        db.flush()
        cat_by_slug[cat.slug] = cat

    # 2. Disposal Methods
    methods_data = [
        {
            "name": "Home or Community Composting",
            "slug": "composting",
            "category_id": cat_by_slug["wet-organic"].id,
            "summary": "Convert biodegradable organic matter into compost via aerobic decomposition or municipal wet-waste collection.",
            "default_steps": "Drain excess liquid.\nPlace in a green wet-waste bin or compost pit.\nAvoid mixing plastic wrappers or foil.",
        },
        {
            "name": "Dry Recycling Collection",
            "slug": "dry-recycling",
            "category_id": cat_by_slug["dry-recyclable"].id,
            "summary": "Clean, dry materials routed to Material Recovery Facilities (MRFs) or local recyclers.",
            "default_steps": "Empty contents completely.\nRinse lightly if soiled with food.\nDry and place in the blue dry-waste bin.",
        },
        {
            "name": "Authorized E-Waste Take-Back",
            "slug": "ewaste-takeback",
            "category_id": cat_by_slug["e-waste"].id,
            "summary": "Certified e-waste collection centres safely dismantle electronics, recover copper/gold, and contain toxic components.",
            "default_steps": "Back up and wipe personal data.\nKeep batteries intact and unpunctured.\nDrop off at an authorized e-waste collection point.",
        },
        {
            "name": "Special Hazardous Handling",
            "slug": "hazardous-handling",
            "category_id": cat_by_slug["hazardous-special"].id,
            "summary": "Safe containment and handover to municipal hazardous-waste facilities or pharmacy take-back programs.",
            "default_steps": "Keep in original sealed container when possible.\nDo not pour down drains or burn.\nDeliver to a designated hazardous drop-off point.",
        },
    ]

    method_by_slug = {}
    for m_data in methods_data:
        method = DisposalMethod(**m_data)
        db.add(method)
        db.flush()
        method_by_slug[method.slug] = method

    # 3. Waste Items Catalog (includes all prompt items + extras)
    items_data = [
        {
            "name": "Plastic Bottle",
            "keywords": "pet bottle water soda cold drink plastic container",
            "description": "Single-use PET or HDPE beverage bottle commonly used for water and soft drinks.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable",
            "recyclable": True,
            "disposal_method_text": "Recycling / Dry Waste Collection",
            "instructions": "Empty the bottle completely.\nRinse briefly if it held sugary or sticky liquid.\nCrush lightly and keep the cap on so small caps aren't lost.\nKeep separate from wet food waste and send to dry recycling.",
            "environmental_tip": "Carry a reusable steel or glass bottle to avoid unnecessary single-use plastic.",
            "search_count": 48,
        },
        {
            "name": "Banana Peel",
            "keywords": "fruit peel skin organic kitchen scrap compost",
            "description": "Biodegradable fruit peel rich in potassium and organic nutrients.",
            "category_slug": "wet-organic",
            "method_slug": "composting",
            "bin_type": "Green Bin — Wet / Organic",
            "recyclable": False,
            "disposal_method_text": "Composting / Wet Waste Collection",
            "instructions": "Remove any plastic produce stickers.\nPlace in your green wet-waste bin or home compost bin.\nCover with dry leaves or shredded paper if composting at home to prevent odor.",
            "environmental_tip": "Composting kitchen peels keeps methane-producing organics out of landfills.",
            "search_count": 35,
        },
        {
            "name": "Newspaper",
            "keywords": "paper magazine flyer print cardboard",
            "description": "Clean printed paper products suitable for pulping and paper recycling.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable",
            "recyclable": True,
            "disposal_method_text": "Paper Recycling / Dry Waste Collection",
            "instructions": "Keep newspapers flat, clean, and dry.\nBundle them or place in the dry recycling bin.\nDo not mix with oil-stained food wrappers.",
            "environmental_tip": "Recycling paper saves trees, water, and energy compared to virgin pulp manufacturing.",
            "search_count": 29,
        },
        {
            "name": "Glass Bottle",
            "keywords": "jar glass container beverage sauce bottle",
            "description": "Clear, green, or amber glass bottles and jars that can be infinitely recycled without quality loss.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable (Handle Carefully)",
            "recyclable": True,
            "disposal_method_text": "Glass Recycling Collection",
            "instructions": "Empty and rinse the glass bottle.\nRemove metal or plastic lids (recycle lids separately if accepted).\nDo not shatter the bottle; wrap broken glass safely in thick paper and label it.",
            "environmental_tip": "Reuse sturdy glass jars for pantry storage before sending them for recycling.",
            "search_count": 26,
        },
        {
            "name": "Aluminium Can",
            "keywords": "soda can tin beverage metal can",
            "description": "Lightweight aluminium beverage can with high recycling recovery value.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable",
            "recyclable": True,
            "disposal_method_text": "Metal Recycling Collection",
            "instructions": "Empty all remaining liquid.\nGive a quick rinse to avoid attracting pests.\nPlace in the dry/recyclable bin or scrap metal collection point.",
            "environmental_tip": "Recycling aluminium uses only a fraction of the energy required to produce new aluminium from ore.",
            "search_count": 24,
        },
        {
            "name": "Battery",
            "keywords": "aa aaa lithium battery cell button battery",
            "description": "Alkaline, lithium-ion, or button-cell batteries containing heavy metals and reactive electrolytes.",
            "category_slug": "hazardous-special",
            "method_slug": "hazardous-handling",
            "bin_type": "Red / Hazardous & Battery Drop-off Box",
            "recyclable": True,
            "disposal_method_text": "Hazardous / Battery Collection Point",
            "instructions": "Never throw batteries into regular wet or dry trash bins.\nTape the metal terminals of lithium or 9V batteries to prevent short circuits.\nStore in a dry, cool container until drop-off.\nTake to a registered battery or e-waste collection centre.",
            "environmental_tip": "Switch to rechargeable batteries where practical to reduce disposable battery waste.",
            "search_count": 41,
        },
        {
            "name": "Mobile Phone",
            "keywords": "smartphone old phone cell phone handset ewaste",
            "description": "Discarded or broken smartphone containing lithium battery, display glass, and precious circuit metals.",
            "category_slug": "e-waste",
            "method_slug": "ewaste-takeback",
            "bin_type": "Amber E-Waste Collection Point",
            "recyclable": True,
            "disposal_method_text": "Authorized E-Waste Recycling / Trade-In",
            "instructions": "Back up important photos and contacts.\nSign out of accounts and perform a factory reset.\nRemove SIM and SD cards.\nDeliver to an authorized e-waste recycler or manufacturer take-back kiosk.",
            "environmental_tip": "If the phone still works, consider donating or refurbishing it before recycling.",
            "search_count": 44,
        },
        {
            "name": "Charger",
            "keywords": "usb cable power adapter wire earphone cord",
            "description": "Phone chargers, USB cables, and power adapters containing copper wiring and electronic components.",
            "category_slug": "e-waste",
            "method_slug": "ewaste-takeback",
            "bin_type": "Amber E-Waste Collection Point",
            "recyclable": True,
            "disposal_method_text": "Authorized E-Waste Collection",
            "instructions": "Coil the cable neatly to prevent tangling during sorting.\nKeep frayed or damaged chargers unplugged and away from moisture.\nDrop off at an e-waste collection bin or electronics retailer drop-box.",
            "environmental_tip": "Standardized USB-C chargers help reduce duplicate cables across devices.",
            "search_count": 22,
        },
        {
            "name": "Old Clothes",
            "keywords": "textile fabric shirt jeans worn clothes shoes",
            "description": "Clean wearable garments or torn cotton/synthetic textiles.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Dry Textile Donation / Recycling Drop-off",
            "recyclable": True,
            "disposal_method_text": "Donation (if wearable) or Textile Recycling",
            "instructions": "Wash and dry clothes before sorting.\nSeparate wearable clothes for local charity or thrift donation.\nSend torn or unwearable fabric to a textile recycling drop-off or repurpose as cleaning rags.",
            "environmental_tip": "Extending the life of clothes through repair and reuse significantly lowers textile waste.",
            "search_count": 19,
        },
        {
            "name": "Food Waste",
            "keywords": "leftovers cooked food vegetable scraps rice bread",
            "description": "Cooked leftovers, vegetable trimmings, coffee grounds, and spoiled food.",
            "category_slug": "wet-organic",
            "method_slug": "composting",
            "bin_type": "Green Bin — Wet / Organic",
            "recyclable": False,
            "disposal_method_text": "Municipal Wet Waste / Biogas / Composting",
            "instructions": "Drain excess water or oil before placing in the bin.\nRemove all plastic packaging, cling wrap, or foil.\nDispose in the green wet-waste bin for municipal composting or biogas.",
            "environmental_tip": "Plan meals and store leftovers properly to prevent edible food waste at the source.",
            "search_count": 31,
        },
        {
            "name": "Medicine Strip",
            "keywords": "expired tablets pills blister pack syrup bottle medical",
            "description": "Expired or unused pharmaceuticals and foil-plastic blister packs.",
            "category_slug": "hazardous-special",
            "method_slug": "hazardous-handling",
            "bin_type": "Red / Pharmacy Take-Back or Hazardous Waste",
            "recyclable": False,
            "disposal_method_text": "Medical Take-Back / Special Hazardous Disposal",
            "instructions": "Do not flush expired medicines down the sink or toilet.\nKeep medicines inside their original strip or sealed container.\nCheck for a local pharmacy medicine take-back box or municipal hazardous drop-off.",
            "environmental_tip": "Buy only prescribed quantities of medicine to minimize expired pharmaceutical waste.",
            "search_count": 33,
        },
        {
            "name": "Cardboard Box",
            "keywords": "corrugated carton delivery box amazon parcel",
            "description": "Shipping cartons, cereal boxes, and clean corrugated cardboard.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable",
            "recyclable": True,
            "disposal_method_text": "Cardboard Recycling Collection",
            "instructions": "Remove packing tape, bubble wrap, and shipping labels where possible.\nFlatten the box completely to save bin space.\nKeep dry and place in the blue recycling bin.",
            "environmental_tip": "Reuse sturdy shipping boxes for storage or moving before recycling them.",
            "search_count": 21,
        },
        {
            "name": "CFL / LED Bulb",
            "keywords": "tube light compact fluorescent bulb lamp",
            "description": "Light bulbs; CFLs and fluorescent tubes contain small amounts of mercury vapor.",
            "category_slug": "hazardous-special",
            "method_slug": "hazardous-handling",
            "bin_type": "Red / Special Hazardous & E-Waste Drop-off",
            "recyclable": True,
            "disposal_method_text": "Special Bulb / E-Waste Recycling",
            "instructions": "Handle gently to avoid shattering.\nWrap in its original sleeve or cardboard.\nDrop off at a hardware store bulb bin or hazardous/e-waste facility.",
            "environmental_tip": "Prefer long-lasting LED bulbs over mercury-containing CFL tubes.",
            "search_count": 15,
        },
        {
            "name": "Laptop / Tablet",
            "keywords": "computer notebook ipad screen monitor ewaste",
            "description": "End-of-life personal computers containing lithium batteries, circuit boards, and metals.",
            "category_slug": "e-waste",
            "method_slug": "ewaste-takeback",
            "bin_type": "Amber E-Waste Collection Point",
            "recyclable": True,
            "disposal_method_text": "Certified E-Waste Recycler / Refurbisher",
            "instructions": "Back up files and securely wipe the storage drive.\nDo not disassemble the battery yourself if swollen.\nHand over to a certified e-waste collection centre.",
            "environmental_tip": "Upgrading RAM or SSD can often extend a laptop's useful life by several years.",
            "search_count": 18,
        },
        {
            "name": "Garden Waste",
            "keywords": "leaves grass clippings twigs yard trimmings",
            "description": "Fallen leaves, pruned twigs, and lawn clippings from yards or balconies.",
            "category_slug": "wet-organic",
            "method_slug": "composting",
            "bin_type": "Green Bin — Wet / Organic",
            "recyclable": False,
            "disposal_method_text": "Garden Composting / Mulching",
            "instructions": "Never burn dry leaves in open piles.\nShred larger twigs if composting at home.\nAdd as 'brown' carbon-rich layer to balance wet kitchen scraps.",
            "environmental_tip": "Dry leaves make an ideal base layer for odor-free home composting.",
            "search_count": 12,
        },
        {
            "name": "Tetra Pak Carton",
            "keywords": "milk carton juice box aseptic packaging",
            "description": "Multi-layer beverage cartons made of paperboard, thin polyethylene, and aluminium foil.",
            "category_slug": "dry-recyclable",
            "method_slug": "dry-recycling",
            "bin_type": "Blue Bin — Dry / Recyclable",
            "recyclable": True,
            "disposal_method_text": "Carton / Dry Recycling Collection",
            "instructions": "Empty the carton completely and rinse with a splash of water.\nPush the straw inside (if plastic) and flatten the carton.\nPlace in the dry recycling bin or dedicated carton drop-off.",
            "environmental_tip": "Buying larger family-size cartons reduces packaging per liter.",
            "search_count": 14,
        },
    ]

    item_by_name = {}
    for i_data in items_data:
        cat_slug = i_data.pop("category_slug")
        meth_slug = i_data.pop("method_slug")
        item = WasteItem(
            **i_data,
            category_id=cat_by_slug[cat_slug].id,
            disposal_method_id=method_by_slug[meth_slug].id,
        )
        db.add(item)
        db.flush()
        item_by_name[item.name] = item

    # 4. Collection / Recycling Centres (Campus + City Metro sample locations)
    centres_data = [
        {
            "name": "GreenCycle Campus MRF & Eco Hub",
            "address": "Gate 2, University Eco Park Road",
            "city": "Pune",
            "waste_types": "Plastic,Paper,Glass,Metal,General recycling",
            "contact_phone": "+91-20-5550-1011",
            "contact_email": "campus@greencycle-demo.org",
            "operating_hours": "Mon–Sat: 8:30 AM – 6:30 PM",
            "notes": "Student-friendly drop-off point for clean dry recyclables and textbooks.",
            "latitude": 18.5284,
            "longitude": 73.8492,
        },
        {
            "name": "Sahyadri Authorized E-Waste Recycler",
            "address": "Plot 14, Industrial Estate, Shivajinagar",
            "city": "Pune",
            "waste_types": "E-waste,Metal",
            "contact_phone": "+91-20-5550-2044",
            "contact_email": "ewaste@sahyadri-demo.org",
            "operating_hours": "Mon–Sat: 9:30 AM – 6:00 PM",
            "notes": "Accepts phones, laptops, chargers, cables, circuit boards, and small appliances.",
            "latitude": 18.5314,
            "longitude": 73.8446,
        },
        {
            "name": "Swachh Ward 7 Material Recovery Centre",
            "address": "Near Municipal Garden, Kothrud",
            "city": "Pune",
            "waste_types": "Plastic,Paper,Glass,Metal,General recycling",
            "contact_phone": "+91-20-5550-3099",
            "contact_email": "ward7@swachh-demo.org",
            "operating_hours": "Daily: 7:30 AM – 2:00 PM",
            "notes": "Municipal dry waste sorting centre with separate glass and metal bins.",
            "latitude": 18.5074,
            "longitude": 73.8077,
        },
        {
            "name": "EcoSpark Battery & Hazardous Drop-Off",
            "address": "42 Link Road, Deccan Gymkhana",
            "city": "Pune",
            "waste_types": "E-waste,Hazardous,Batteries",
            "contact_phone": "+91-20-5550-4120",
            "contact_email": "safe@ecospark-demo.org",
            "operating_hours": "Tue–Sun: 10:00 AM – 7:00 PM",
            "notes": "Specialized intake for lithium batteries, CFL tubes, and expired medicine boxes.",
            "latitude": 18.5158,
            "longitude": 73.8415,
        },
        {
            "name": "ReCraft Paper & Carton Recovery Unit",
            "address": "18 Riverfront Lane, Koregaon Park",
            "city": "Pune",
            "waste_types": "Paper,Plastic,General recycling",
            "contact_phone": "+91-20-5550-5501",
            "contact_email": "hello@recraft-demo.org",
            "operating_hours": "Mon–Fri: 9:00 AM – 5:30 PM",
            "notes": "Focuses on corrugated cardboard, newspapers, Tetra Pak cartons, and clean PET.",
            "latitude": 18.5362,
            "longitude": 73.8940,
        },
        {
            "name": "Viman Nagar Zero-Waste Community Point",
            "address": "Sector 4 Community Hall, Viman Nagar",
            "city": "Pune",
            "waste_types": "E-waste,Plastic,Paper,Glass,Metal,General recycling",
            "contact_phone": "+91-20-5550-6780",
            "contact_email": "community@zerowaste-demo.org",
            "operating_hours": "Wed, Sat, Sun: 9:00 AM – 5:00 PM",
            "notes": "Weekend community drop-off drive accepting both dry recyclables and small e-waste.",
            "latitude": 18.5679,
            "longitude": 73.9143,
        },
    ]

    for centre in centres_data:
        db.add(CollectionCentre(**centre))

    # 5. Challenges
    challenges_data = [
        {
            "title": "7-Day Segregation Challenge",
            "description": "Separate wet organic waste and dry recyclable waste every day for 7 consecutive days.",
            "challenge_type": "daily",
            "target_count": 7,
            "unit_label": "days",
            "points_reward": 70,
            "category_tag": "Daily Habit",
        },
        {
            "title": "Recycle 10 Items",
            "description": "Clean, sort, and responsibly recycle 10 dry waste items (bottles, cans, paper, or glass).",
            "challenge_type": "count",
            "target_count": 10,
            "unit_label": "items",
            "points_reward": 50,
            "category_tag": "Dry Recycling",
        },
        {
            "title": "Properly Dispose of 3 E-Waste Items",
            "description": "Collect old chargers, cables, batteries, or unused phones at home and take them to an e-waste drop-off.",
            "challenge_type": "count",
            "target_count": 3,
            "unit_label": "e-waste items",
            "points_reward": 80,
            "category_tag": "E-Waste",
        },
        {
            "title": "Avoid Single-Use Plastic for 7 Days",
            "description": "Carry a reusable bottle and cloth bag for a full week to reduce single-use plastic at the source.",
            "challenge_type": "daily",
            "target_count": 7,
            "unit_label": "days",
            "points_reward": 65,
            "category_tag": "Reduce (3R)",
        },
    ]

    challenge_by_title = {}
    for ch_data in challenges_data:
        ch = Challenge(**ch_data)
        db.add(ch)
        db.flush()
        challenge_by_title[ch.title] = ch

    # 6. Awareness Articles
    articles_data = [
        {
            "title": "Why Waste Segregation at Source Matters",
            "slug": "why-waste-segregation-matters",
            "summary": "Mixing wet food waste with paper and plastic contaminates recyclables and sends recoverable materials to landfills.",
            "content": (
                "When organic kitchen scraps are tossed into the same bin as paper, cardboard, and plastic, moisture and food oils "
                "contaminate dry recyclables. Once contaminated, paper fibers weaken and plastic batches become too costly to clean.\n\n"
                "Segregating at the source—using separate containers for Wet/Organic, Dry/Recyclable, E-Waste, and Hazardous items—keeps "
                "materials clean, protects sanitation workers from sharp or toxic items, and dramatically improves material recovery rates."
            ),
            "category_tag": "Segregation Basics",
            "reading_time_mins": 3,
            "is_featured": True,
        },
        {
            "title": "Wet vs Dry Waste: A Simple Visual Guide",
            "slug": "wet-vs-dry-waste",
            "summary": "Learn the fastest rule of thumb to decide whether an item goes into the Green wet bin or Blue dry bin.",
            "content": (
                "Wet waste refers to biodegradable organic matter: vegetable peels, fruit scraps, cooked leftovers, tea leaves, and garden trimmings. "
                "These break down naturally into compost or biogas.\n\n"
                "Dry waste includes clean, non-biodegradable recyclables: plastic bottles, cartons, newspapers, metal cans, and glass jars. "
                "Always empty and lightly rinse food containers before putting them in the dry bin."
            ),
            "category_tag": "Segregation Basics",
            "reading_time_mins": 3,
            "is_featured": True,
        },
        {
            "title": "How Plastic Recycling Works (and Its Limits)",
            "slug": "plastic-recycling-explained",
            "summary": "Not all plastics are recycled equally. Understanding resin codes #1 and #2 helps you sort smarter.",
            "content": (
                "PET (#1, water/soda bottles) and HDPE (#2, milk jugs/detergent bottles) are the most widely recycled plastics. "
                "Multi-layer snack wrappers and thin soiled films are much harder to reprocess.\n\n"
                "Before recycling plastic bottles: empty them, give a quick rinse, and keep them dry. Most importantly, reducing single-use plastic "
                "remains far more effective than relying solely on recycling."
            ),
            "category_tag": "Plastic & Recycling",
            "reading_time_mins": 4,
            "is_featured": False,
        },
        {
            "title": "The Hidden Dangers of Improper E-Waste Disposal",
            "slug": "e-waste-problems",
            "summary": "Discarded phones, chargers, and batteries leak toxic metals when burned or dumped, yet hold valuable recoverable copper and gold.",
            "content": (
                "Electronic waste is one of the fastest-growing waste streams globally. Devices contain hazardous elements like lead, cadmium, "
                "and lithium-ion cells that can cause fires in garbage trucks or leach into groundwater.\n\n"
                "At the same time, circuit boards hold copper, silver, and gold. Dropping old electronics at authorized e-waste centres ensures "
                "safe dismantling and responsible resource recovery."
            ),
            "category_tag": "E-Waste",
            "reading_time_mins": 4,
            "is_featured": True,
        },
        {
            "title": "Home Composting 101 for Apartments & Hostels",
            "slug": "composting-basics",
            "summary": "Turn daily fruit and vegetable peels into odor-free compost using the simple Greens + Browns balance.",
            "content": (
                "Composting needs two ingredients: 'Greens' (nitrogen-rich kitchen peels and coffee grounds) and 'Browns' (carbon-rich dry leaves, "
                "cocopeat, or shredded cardboard).\n\n"
                "Layer wet scraps with an equal volume of dry browns in an aerated bin, turn once a week, and keep moisture like a wrung-out sponge. "
                "Avoid meat, dairy, and oily foods in small home bins."
            ),
            "category_tag": "Composting",
            "reading_time_mins": 4,
            "is_featured": False,
        },
        {
            "title": "Inside the Recycling Process: From Bin to New Product",
            "slug": "recycling-process",
            "summary": "Follow what happens to your bottle or newspaper after collection—from MRF sorting to baling and remanufacturing.",
            "content": (
                "1. Collection & Transport: Clean dry waste is collected separately from wet waste.\n"
                "2. Sorting at a Material Recovery Facility (MRF): Workers and optical sorters separate paper, metals, glass, and plastic polymers.\n"
                "3. Cleaning & Baling: Sorted materials are compressed into bales and sold to reprocessing mills.\n"
                "4. Remanufacturing: Aluminium becomes new cans, PET becomes fiber/bottles, and paper becomes recycled cardboard."
            ),
            "category_tag": "Plastic & Recycling",
            "reading_time_mins": 3,
            "is_featured": False,
        },
        {
            "title": "Reducing Single-Use Plastics in College Life",
            "slug": "reducing-single-use-plastics",
            "summary": "Practical swaps—refillable bottles, cloth totes, and steel cutlery—cut daily campus plastic waste effortlessly.",
            "content": (
                "Most single-use plastic items—water bottles, straws, takeaway bags, and disposable cups—are used for minutes but persist for decades.\n\n"
                "Simple student habits like carrying a refillable flask, keeping a foldable tote bag in your backpack, and declining plastic cutlery "
                "eliminate dozens of disposable items per month."
            ),
            "category_tag": "Reduce & Reuse",
            "reading_time_mins": 3,
            "is_featured": False,
        },
        {
            "title": "The 3R Principle: Reduce, Reuse, Recycle",
            "slug": "3r-principle-guide",
            "summary": "Why the 3Rs are ordered by priority—and how EcoSort connects everyday decisions to Reduce, Reuse, and Recycle.",
            "content": (
                "The 3R hierarchy puts prevention first:\n"
                "• REDUCE: Generate less waste from the start by refusing unnecessary packaging and single-use items.\n"
                "• REUSE: Repair, refill, donate, or repurpose items before discarding them.\n"
                "• RECYCLE: When an item reaches end-of-life, sort it cleanly so materials can be recovered into new products."
            ),
            "category_tag": "3R Principle",
            "reading_time_mins": 3,
            "is_featured": True,
        },
    ]

    for art in articles_data:
        db.add(AwarenessArticle(**art))

    # 7. Demo Accounts & Realistic Activity History (for smooth college demonstration)
    if include_demo_users:
        demo_user = User(
            name="Aarav Sharma",
            email="student@ecosort.demo",
            password_hash=hash_password("EcoSort@123"),
            role="user",
            is_active=True,
            location="Pune Campus",
        )
        demo_admin = User(
            name="Dr. Meera Kulkarni (Admin)",
            email="admin@ecosort.demo",
            password_hash=hash_password("AdminEco@123"),
            role="admin",
            is_active=True,
            location="Environmental Science Dept",
        )
        peer_user = User(
            name="Priya Nair",
            email="priya@ecosort.demo",
            password_hash=hash_password("EcoSort@123"),
            role="user",
            is_active=True,
            location="Kothrud",
        )
        db.add_all([demo_user, demo_admin, peer_user])
        db.flush()

        today = date.today()
        sample_records = [
            ("Plastic Bottle", "dry-recyclable", "Recycled", 2, today - timedelta(days=3), "Rinsed & dropped in Blue Bin"),
            ("Newspaper", "dry-recyclable", "Recycled", 1, today - timedelta(days=2), "Bundled old weeklies"),
            ("Mobile Phone", "e-waste", "E-Waste Disposal", 1, today - timedelta(days=1), "Wiped & handed to Sahyadri E-Waste"),
            ("Food Waste", "wet-organic", "Composted", 1, today, "Home compost bin"),
            ("Aluminium Can", "dry-recyclable", "Recycled", 3, today, "Canteen recycling bin"),
        ]
        for item_name, cat_slug, action, qty, d_date, notes in sample_records:
            cat = cat_by_slug[cat_slug]
            w_item = item_by_name.get(item_name)
            pts = calculate_record_points(cat_slug, action, qty)
            db.add(
                WasteRecord(
                    user_id=demo_user.id,
                    waste_item_id=w_item.id if w_item else None,
                    item_name=item_name,
                    category_id=cat.id,
                    action_type=action,
                    quantity=qty,
                    points_earned=pts,
                    notes=notes,
                    disposed_date=d_date,
                )
            )

        # Peer records so admin analytics charts look rich
        peer_records = [
            ("Charger", "e-waste", "E-Waste Disposal", 1, today - timedelta(days=2)),
            ("Glass Bottle", "dry-recyclable", "Recycled", 2, today - timedelta(days=1)),
            ("Banana Peel", "wet-organic", "Composted", 1, today),
            ("Battery", "hazardous-special", "Hazardous Drop-off", 2, today),
        ]
        for item_name, cat_slug, action, qty, d_date in peer_records:
            cat = cat_by_slug[cat_slug]
            w_item = item_by_name.get(item_name)
            pts = calculate_record_points(cat_slug, action, qty)
            db.add(
                WasteRecord(
                    user_id=peer_user.id,
                    waste_item_id=w_item.id if w_item else None,
                    item_name=item_name,
                    category_id=cat.id,
                    action_type=action,
                    quantity=qty,
                    points_earned=pts,
                    disposed_date=d_date,
                )
            )

        # Challenge progress for demo user
        ch_7day = challenge_by_title["7-Day Segregation Challenge"]
        ch_recycle10 = challenge_by_title["Recycle 10 Items"]
        db.add(
            ChallengeProgress(
                user_id=demo_user.id,
                challenge_id=ch_7day.id,
                current_count=4,
                completed_steps_json=json.dumps([1, 2, 3, 4]),
                status="in_progress",
            )
        )
        db.add(
            ChallengeProgress(
                user_id=demo_user.id,
                challenge_id=ch_recycle10.id,
                current_count=6,
                completed_steps_json=json.dumps([1, 2, 3, 4, 5, 6]),
                status="in_progress",
            )
        )
        db.add(
            ChallengeProgress(
                user_id=peer_user.id,
                challenge_id=ch_7day.id,
                current_count=7,
                completed_steps_json=json.dumps([1, 2, 3, 4, 5, 6, 7]),
                status="completed",
                reward_claimed=True,
            )
        )

        db.flush()
        recalculate_user_score(db, demo_user)
        recalculate_user_score(db, peer_user)

    db.commit()
