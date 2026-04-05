export const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0px',
}

export const cleanMapStyles = [
    // Hide all POIs
    {
        featureType: 'poi',
        elementType: 'all',
        stylers: [{ visibility: 'off' }]
    },
    // Hide transit
    {
        featureType: 'transit',
        elementType: 'all',
        stylers: [{ visibility: 'off' }]
    },
    // Hide all labels by default (we'll selectively re-enable if needed)
    {
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    // Main road styling - lighter gray
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#eef1f5' }, { weight: 0.6 }]
    },
    // Hide road icons
    {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
    },
    // Hide local/minor road labels
    {
        featureType: 'road.local',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    // Show only highway/major road labels
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.stroke',
        stylers: [{ visibility: 'off' }]
    },
    // Highway styling
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#e7ebf1' }]
    },
    // Water - light blue
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#bcd3df' }]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ visibility: 'off' }]
    },
    // Landscape - very light
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f7f8fa' }]
    },
    // Buildings - greenish gray
    {
        featureType: 'landscape.man_made',
        elementType: 'geometry.fill',
        stylers: [{ color: '#f3f3f2' }]
    },
    {
        featureType: 'landscape.man_made',
        elementType: 'geometry.stroke',
        stylers: [{ visibility: 'off' }]
    },
    // Parks - barely visible
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ visibility: 'on' }, { color: '#e8f4e8' }]
    },
    {
        featureType: 'poi.park',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    // Administrative boundaries - subtle
    {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ visibility: 'on' }]
    },
    {
        featureType: 'administrative.land_parcel',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    // Neighborhood labels - keep visible but subtle
    {
        featureType: 'administrative.neighborhood',
        elementType: 'labels.text.fill',
        stylers: [{ visibility: 'on' }, { color: '#babbbc' }]
    },
    // City/locality labels - keep visible
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ visibility: 'off' }]
    }
]
