
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BizBook Management Suite',
    short_name: 'BizBook',
    description: 'Pilotez votre entreprise avec une simplicité déconcertante',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
