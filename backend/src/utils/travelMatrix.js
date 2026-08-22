/**
 * Deterministic Mock Travel Matrix & Multi-Modal Travel Calculator
 */

const KNOWN_ROUTES = {
  'mumbai-goa': { distance: 590, flightHours: 1.2, trainHours: 11, busHours: 14, carHours: 12, flightCost: 4200, trainCost: 1400, busCost: 900, carCost: 6500 },
  'goa-mumbai': { distance: 590, flightHours: 1.2, trainHours: 11, busHours: 14, carHours: 12, flightCost: 4200, trainCost: 1400, busCost: 900, carCost: 6500 },
  'delhi-jaipur': { distance: 280, flightHours: 1.0, trainHours: 4.5, busHours: 6, carHours: 5, flightCost: 3500, trainCost: 950, busCost: 600, carCost: 3200 },
  'jaipur-delhi': { distance: 280, flightHours: 1.0, trainHours: 4.5, busHours: 6, carHours: 5, flightCost: 3500, trainCost: 950, busCost: 600, carCost: 3200 },
  'mumbai-delhi': { distance: 1400, flightHours: 2.1, trainHours: 16, busHours: 28, carHours: 24, flightCost: 5500, trainCost: 2200, busCost: 1800, carCost: 14000 },
  'delhi-mumbai': { distance: 1400, flightHours: 2.1, trainHours: 16, busHours: 28, carHours: 24, flightCost: 5500, trainCost: 2200, busCost: 1800, carCost: 14000 },
  'delhi-manali': { distance: 540, flightHours: 1.5, trainHours: 12, busHours: 14, carHours: 13, flightCost: 6500, trainCost: 1500, busCost: 1200, carCost: 8000 },
  'manali-delhi': { distance: 540, flightHours: 1.5, trainHours: 12, busHours: 14, carHours: 13, flightCost: 6500, trainCost: 1500, busCost: 1200, carCost: 8000 },
  'mumbai-jaipur': { distance: 1150, flightHours: 1.8, trainHours: 15, busHours: 22, carHours: 19, flightCost: 4800, trainCost: 1900, busCost: 1500, carCost: 11000 },
  'jaipur-mumbai': { distance: 1150, flightHours: 1.8, trainHours: 15, busHours: 22, carHours: 19, flightCost: 4800, trainCost: 1900, busCost: 1500, carCost: 11000 },
  'jaipur-goa': { distance: 1600, flightHours: 2.5, trainHours: 26, busHours: 34, carHours: 28, flightCost: 6200, trainCost: 2600, busCost: 2200, carCost: 16500 },
  'goa-jaipur': { distance: 1600, flightHours: 2.5, trainHours: 26, busHours: 34, carHours: 28, flightCost: 6200, trainCost: 2600, busCost: 2200, carCost: 16500 },
  'delhi-goa': { distance: 1850, flightHours: 2.5, trainHours: 28, busHours: 38, carHours: 32, flightCost: 6800, trainCost: 2800, busCost: 2500, carCost: 19000 },
  'goa-delhi': { distance: 1850, flightHours: 2.5, trainHours: 28, busHours: 38, carHours: 32, flightCost: 6800, trainCost: 2800, busCost: 2500, carCost: 19000 }
};

const normalizeCity = (c) => (c ? String(c).toLowerCase().trim() : '');

const calculateTravelSegment = (fromCityName, toCityName) => {
  const from = normalizeCity(fromCityName);
  const to = normalizeCity(toCityName);

  if (from === to) {
    return {
      from: fromCityName,
      to: toCityName,
      estimatedDistance: 0,
      estimatedDuration: 0,
      estimatedCost: 0,
      recommendedMode: 'CAR',
      options: [
        { mode: 'CAR', estimatedDuration: 0.5, estimatedCost: 200, comfortScore: 9 }
      ]
    };
  }

  const routeKey = `${from}-${to}`;
  const known = KNOWN_ROUTES[routeKey];

  let distance = 600;
  let flightHours = 1.5;
  let trainHours = 10;
  let busHours = 14;
  let carHours = 12;
  let flightCost = 4500;
  let trainCost = 1500;
  let busCost = 900;
  let carCost = 6000;

  if (known) {
    distance = known.distance;
    flightHours = known.flightHours;
    trainHours = known.trainHours;
    busHours = known.busHours;
    carHours = known.carHours;
    flightCost = known.flightCost;
    trainCost = known.trainCost;
    busCost = known.busCost;
    carCost = known.carCost;
  } else {
    // Deterministic pseudo-distance based on hash
    const hash = Math.abs((from.charCodeAt(0) * 31 + to.charCodeAt(0)) % 10);
    distance = 300 + hash * 120;
    flightHours = Math.round((distance / 500 + 0.8) * 10) / 10;
    trainHours = Math.round((distance / 65) * 10) / 10;
    busHours = Math.round((distance / 45) * 10) / 10;
    carHours = Math.round((distance / 55) * 10) / 10;
    flightCost = Math.round(distance * 4.5 + 2000);
    trainCost = Math.round(distance * 1.5 + 400);
    busCost = Math.round(distance * 1.0 + 200);
    carCost = Math.round(distance * 9);
  }

  // Determine recommended mode:
  // > 500km -> FLIGHT, 200-500km -> TRAIN, <= 200km -> CAR or BUS
  let recommendedMode = 'FLIGHT';
  if (distance <= 300) {
    recommendedMode = 'TRAIN';
  } else if (distance <= 600) {
    recommendedMode = trainHours <= 8 ? 'TRAIN' : 'FLIGHT';
  } else {
    recommendedMode = 'FLIGHT';
  }

  const options = [
    {
      mode: 'FLIGHT',
      estimatedDuration: flightHours,
      estimatedCost: flightCost,
      comfortScore: 9
    },
    {
      mode: 'TRAIN',
      estimatedDuration: trainHours,
      estimatedCost: trainCost,
      comfortScore: 7
    },
    {
      mode: 'BUS',
      estimatedDuration: busHours,
      estimatedCost: busCost,
      comfortScore: 5
    },
    {
      mode: 'CAR',
      estimatedDuration: carHours,
      estimatedCost: carCost,
      comfortScore: 8
    }
  ];

  const recOption = options.find((o) => o.mode === recommendedMode) || options[0];

  return {
    from: fromCityName,
    to: toCityName,
    estimatedDistance: distance,
    estimatedDuration: recOption.estimatedDuration,
    estimatedCost: recOption.estimatedCost,
    recommendedMode,
    options
  };
};

module.exports = {
  calculateTravelSegment
};
