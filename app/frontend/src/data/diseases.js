// What the app shows for each class the model knows.
// `id` is the PlantVillage folder name, the label in data/classes.json.
// `slug` is used in page links and for the library photo: public/library/<slug>.jpg

export const TREATMENT_NOTE =
  'Use only products registered in your country and follow the label. A local agricultural officer can tell you which products and doses to use.'

export const diseases = [
  {
    id: 'Tomato___Bacterial_spot',
    slug: 'bacterial-spot',
    name: 'Bacterial spot',
    type: 'Bacterium',
    cause: 'Bacteria: Xanthomonas species (X. euvesicatoria, X. vesicatoria, X. perforans, X. gardneri)',
    short: 'Small dark spots, often with a yellow ring, caused by bacteria that spread in warm, wet weather.',
    spread: 'Rain and water splashing from leaf to leaf, infected seed and transplants, hands and tools.',
    symptoms: [
      'Small (1–3 mm) spots on the leaves, water-soaked at first, then dark brown to black.',
      'Spots often have a yellow ring; many spots can join, and the leaf turns yellow and drops.',
      'Raised, scabby spots on green fruit.',
    ],
    treatment: [
      'Remove and destroy badly infected leaves.',
      'Spray a copper-based product (often mixed with mancozeb). Start early: sprays slow the spread but do not cure leaves that are already infected.',
      'Do not work with the plants while they are wet.',
    ],
    prevention: [
      'Use certified disease-free seed and healthy transplants.',
      'Rotate crops: no tomato or pepper in the same soil for 2–3 years.',
      'Water at the base of the plant (drip irrigation), not over the leaves.',
      'Remove crop debris and self-grown tomato plants after harvest.',
    ],
  },
  {
    id: 'Tomato___Early_blight',
    slug: 'early-blight',
    name: 'Early blight',
    type: 'Fungus',
    cause: 'Fungus: Alternaria solani (also A. linariae)',
    short: 'Brown spots with rings like a target, starting on the older, lower leaves.',
    spread: 'Spores in the soil and on old plant debris, carried by wind and splashing water.',
    symptoms: [
      'Brown to black spots with rings inside them, like a target, up to about 1 cm wide.',
      'A yellow area around the spots; badly affected leaves turn yellow and fall.',
      'It starts on the oldest, lowest leaves and moves upward.',
    ],
    treatment: [
      'Remove infected lower leaves.',
      'Spray a fungicide such as chlorothalonil, mancozeb or a copper product, repeated as the label says.',
      'Mulch the soil so spores do not splash up onto the leaves.',
    ],
    prevention: [
      'Rotate crops: 2–3 years without tomato or potato in the same soil.',
      'Stake the plants and remove the lowest leaves, so air moves between them.',
      'Water at the base of the plant, in the morning.',
      'Keep plants well fed; weak plants are hit harder.',
    ],
  },
  {
    id: 'Tomato___Late_blight',
    slug: 'late-blight',
    name: 'Late blight',
    type: 'Water mould',
    cause: 'Water mould (oomycete): Phytophthora infestans',
    short: 'Large, dark, water-soaked patches that spread very fast in cool, wet weather.',
    spread: 'Spores carried by wind over long distances, in cool, wet weather; also from infected potato plants.',
    symptoms: [
      'Large, irregular, grey-green, water-soaked patches that turn brown to black.',
      'White, fuzzy growth on the underside of the leaf in humid weather.',
      'Dark patches on the stems and firm brown patches on the fruit.',
      'It can kill a whole plant within days.',
    ],
    treatment: [
      'Act quickly: remove infected leaves or whole plants, put them in a bag and destroy them. Do not compost them.',
      'Protect the nearby plants with a fungicide such as chlorothalonil, mancozeb or a copper product.',
      'Ask a local agricultural officer about products made for late blight; they work better once it has started.',
    ],
    prevention: [
      'Grow resistant varieties.',
      'Keep the leaves dry: water at the base and give the plants space.',
      'Remove self-grown potato and tomato plants.',
      'Check the plants often in cool, wet weather.',
    ],
  },
  {
    id: 'Tomato___Leaf_Mold',
    slug: 'leaf-mold',
    name: 'Leaf mold',
    type: 'Fungus',
    cause: 'Fungus: Passalora fulva (also called Fulvia fulva or Cladosporium fulvum)',
    short: 'Yellow spots on top of the leaf and olive-green, velvety mould underneath; common in humid greenhouses.',
    spread: 'Spores in the air, in high humidity (above about 85%), mostly in greenhouses and tunnels.',
    symptoms: [
      'Pale green to yellow spots on the upper side of the leaf.',
      'Olive-green to grey-brown, velvety mould on the underside, under the spots.',
      'Leaves curl, dry and drop, older leaves first.',
    ],
    treatment: [
      'Lower the humidity: open vents, space the plants, avoid wetting the leaves.',
      'Remove infected leaves.',
      'If needed, spray a fungicide such as chlorothalonil, mancozeb or a copper product.',
    ],
    prevention: [
      'Grow resistant varieties.',
      'Keep the humidity below about 85% and let air move between the plants.',
      'Clean the greenhouse between crops.',
    ],
  },
  {
    id: 'Tomato___Septoria_leaf_spot',
    slug: 'septoria-leaf-spot',
    name: 'Septoria leaf spot',
    type: 'Fungus',
    cause: 'Fungus: Septoria lycopersici',
    short: 'Many small round spots with dark edges and pale centres, on the lower leaves first.',
    spread: 'Spores on old plant debris and weeds, spread by splashing water, hands and tools.',
    symptoms: [
      'Many small, round spots (about 1.5–6 mm) with dark brown edges and grey or tan centres.',
      'Tiny black dots inside the spots (the spore cases of the fungus).',
      'It starts on the lower leaves; the leaves turn yellow, dry and fall.',
    ],
    treatment: [
      'Remove infected leaves.',
      'Spray a fungicide such as chlorothalonil, mancozeb or a copper product.',
      'Mulch the soil so spores do not splash up onto the leaves.',
    ],
    prevention: [
      'Rotate crops.',
      'Remove and destroy plant debris after harvest, and weeds such as nightshade.',
      'Water at the base of the plant; do not work with wet plants.',
    ],
  },
  {
    id: 'Tomato___Spider_mites Two-spotted_spider_mite',
    slug: 'spider-mites',
    name: 'Spider mites',
    type: 'Pest',
    cause: 'Pest: the two-spotted spider mite (Tetranychus urticae)',
    short: 'Tiny mites under the leaf cause fine yellow speckles and webbing; worst in hot, dry weather.',
    spread: 'The mites crawl between plants and are carried by wind, clothes and tools. They multiply fast when it is hot and dry.',
    symptoms: [
      'Tiny yellow or white speckles on the leaves.',
      'Fine webbing on the underside of the leaves and between the stems.',
      'Leaves turn yellow or bronze, dry out and drop.',
    ],
    treatment: [
      'Spray the underside of the leaves with a strong jet of water.',
      'Use insecticidal soap, horticultural oil or neem oil, covering the underside of the leaves.',
      'For heavy attacks, use a miticide, and switch between products so the mites do not become resistant.',
    ],
    prevention: [
      'Water the plants regularly; mites like hot, dry, dusty conditions.',
      'Check the underside of the leaves every week.',
      'Avoid broad-spectrum insecticides, which also kill the natural enemies of the mites, such as predatory mites.',
    ],
  },
  {
    id: 'Tomato___Target_Spot',
    slug: 'target-spot',
    name: 'Target spot',
    type: 'Fungus',
    cause: 'Fungus: Corynespora cassiicola',
    short: 'Brown spots with light centres and rings, similar to early blight; likes warm, humid weather.',
    spread: 'Spores on plant debris, spread by wind and splashing water in warm, humid weather.',
    symptoms: [
      'Small, water-soaked spots that grow into round brown spots with a light centre.',
      'Rings inside the spots, like a target, sometimes with a yellow ring around them.',
      'Spots can join; the leaves dry and fall. Spots can also appear on the stems and fruit.',
    ],
    treatment: [
      'Remove infected leaves.',
      'Spray a fungicide such as chlorothalonil, mancozeb or azoxystrobin.',
      'Remove the lower leaves so more air moves through the plant.',
    ],
    prevention: [
      'Space and stake the plants so air moves between them.',
      'Rotate crops and remove crop debris after harvest.',
      'Water at the base of the plant.',
    ],
  },
  {
    id: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    slug: 'yellow-leaf-curl-virus',
    name: 'Yellow leaf curl virus',
    type: 'Virus',
    cause: 'Virus: Tomato yellow leaf curl virus (TYLCV), spread by the whitefly Bemisia tabaci',
    short: 'Small, upward-curled, yellow-edged leaves and stunted plants; spread by whiteflies.',
    spread: 'Whiteflies carry the virus from plant to plant. It does not spread by touch.',
    symptoms: [
      'Small leaves that curl upward and have yellow edges.',
      'Stunted, bushy plants.',
      'Flowers drop, so few fruits form.',
    ],
    treatment: [
      'There is no cure for an infected plant.',
      'Remove infected plants early, put them in a bag and destroy them.',
      'Control the whiteflies with yellow sticky traps and, if needed, an insecticide recommended locally.',
    ],
    prevention: [
      'Grow resistant varieties.',
      'Raise seedlings under insect-proof net.',
      'Remove weeds that host whiteflies.',
      'Reflective (silver) mulch helps keep whiteflies away.',
    ],
  },
  {
    id: 'Tomato___Tomato_mosaic_virus',
    slug: 'mosaic-virus',
    name: 'Mosaic virus',
    type: 'Virus',
    cause: 'Virus: Tomato mosaic virus (ToMV)',
    short: 'Light and dark green mottled leaves; spread by hands, tools and seed.',
    spread: 'Touch: hands, tools, clothes and infected seed. The virus stays alive on surfaces and in plant debris for a long time.',
    symptoms: [
      'Light and dark green patches (a mosaic pattern) on the leaves.',
      'Leaves may be curled, wrinkled, or narrow and fern-like.',
      'Stunted plants; the fruit may ripen unevenly.',
    ],
    treatment: [
      'There is no cure for an infected plant.',
      'Remove infected plants and destroy them.',
      'After touching infected plants, wash your hands with soap and clean your tools (for example with a household bleach solution).',
    ],
    prevention: [
      'Use certified virus-free seed and resistant varieties.',
      'Wash your hands before handling the plants. Do not use tobacco near them: it can carry a related virus.',
      'Clean tools, stakes and seedling trays between crops.',
    ],
  },
  {
    id: 'Tomato___healthy',
    slug: 'healthy',
    name: 'Healthy leaf',
    type: 'Healthy',
    cause: '',
    short: 'No sign of disease or pests.',
    care: [
      'Water at the base of the plant, in the morning, so the leaves stay dry.',
      'Give the plant 6–8 hours of sun a day and room for air to move.',
      'Stake or cage the plant, and remove the lowest leaves that touch the soil.',
      'Mulch the soil and feed the plant regularly.',
      'Check the leaves, top and underside, every week, so problems are caught early.',
    ],
  },
]

/** The information for a class id; a plain fallback if the model has a class this list does not know. */
export function getDisease(classId) {
  const found = diseases.find((d) => d.id === classId)
  if (found) return found
  return {
    id: classId,
    slug: null,
    name: classId.replace(/^Tomato_+/, '').replaceAll('_', ' '),
    type: 'Unknown',
    cause: '',
    short: '',
    symptoms: [],
    treatment: [],
    prevention: [],
  }
}
