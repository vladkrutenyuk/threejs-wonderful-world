export type MarkerData = {
	id: string
	title: string
	mapNormalizedPosition: {
		x: number
		y: number
		z: number
	}
	url: string
	contentUrl: string
	contentScale: number
}

export const MARKERS: MarkerData[] = [
	{
		id: 'colosseum',
		title: 'Colosseum',
		mapNormalizedPosition: {
			x: 0.536,
			y: 0.729,
			z: 0.51,
		},
		url: 'https://en.wikipedia.org/wiki/Colosseum',
		contentUrl: '/models/Colosseum_Draco.glb',
		contentScale: 0.2,
	},
	{
		id: 'great-wall',
		title: 'Great Wall of China',
		mapNormalizedPosition: {
			x: 0.85,
			y: 0.73,
			z: 0.51,
		},
		url: 'https://en.wikipedia.org/wiki/Great_Wall_of_China',
		contentUrl: '/models/GreatWallOfChina_Draco.glb',
		contentScale: 0.4,
	},
	{
		id: 'machu-picchu',
		title: 'Machu Picchu',
		mapNormalizedPosition: {
			x: 0.3,
			y: 0.43,
			z: 0.51,
		},
		url: 'https://en.wikipedia.org/wiki/Machu_Picchu',
		contentUrl: '/models/MachuPicchu_Draco.glb',
		contentScale: 0.25,
	},
	{
		id: 'petra',
		title: 'Petra',
		mapNormalizedPosition: {
			x: 0.6,
			y: 0.66,
			z: 0.54,
		},
		url: 'https://en.wikipedia.org/wiki/Petra',
		contentUrl: '/models/PetraJordan_Draco.glb',
		contentScale: 0.5,
	},
	{
		id: 'taj-mahal',
		title: 'Taj Mahal',
		mapNormalizedPosition: {
			x: 0.7,
			y: 0.65,
			z: 0.51,
		},
		url: 'https://en.wikipedia.org/wiki/Taj_Mahal',
		contentUrl: '/models/TajMahal_Draco.glb',
		contentScale: 0.35,
	},
	{
		id: 'christ-the-redeemer',
		title: 'Christ the Redeemer',
		mapNormalizedPosition: {
			x: 0.38,
			y: 0.37,
			z: 0.51,
		},
		url: 'https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)',
		contentUrl: '/models/ChristTheRedeemer_Draco.glb',
		contentScale: 0.5,
	},
	{
		id: 'chichen-itza',
		title: 'Chichen Itza',
		mapNormalizedPosition: {
			x: 0.26,
			y: 0.62,
			z: 0.5,
		},
		url: 'https://en.wikipedia.org/wiki/Chichen_Itza',
		contentUrl: '/models/ChichenItza_Draco.glb',
		contentScale: 0.25,
	},
]

export const getMarkerData = (id: MarkerData['id'] | null) => MARKERS.find((marker) => marker.id === id) ?? null
