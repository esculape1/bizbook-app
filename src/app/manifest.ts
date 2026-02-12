import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BizBook Management Suite',
    short_name: 'BizBook',
    description: 'Pilotez votre entreprise avec une simplicité déconcertante',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0EDF7',
    theme_color: '#947BD3',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
