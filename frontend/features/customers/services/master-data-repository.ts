import { BaseRepository } from '@/infra/api/base-repository'
import { HttpService } from '@/infra/api/http-service'
import type { IHttpAdapter } from '@/infra/api/http-adapter'

export interface IMasterDataRepository {
  provinces(): Promise<{ id: number; name: string }[]>
  wards(provinceId?: number): Promise<{ id: number; provinceId: number; name: string }[]>
}

export class MasterDataRepository extends BaseRepository implements IMasterDataRepository {
  constructor(http: IHttpAdapter = HttpService) {
    super(http)
  }

  async provinces(): Promise<{ id: number; name: string }[]> {
    const params = new URLSearchParams()
    params.set('resources[provinces]', '{}')

    const res = await this.get<{
      success: boolean
      data: {
        provinces: { id: number; name: string }[]
      }
    }>('/api/master-data', params)
    return res.data?.provinces || []
  }

  async wards(provinceId?: number): Promise<{ id: number; provinceId: number; name: string }[]> {
    const params = new URLSearchParams()
    const configStr = provinceId ? JSON.stringify({ province_id: provinceId }) : '{}'
    params.set('resources[wards]', configStr)

    const res = await this.get<{
      success: boolean
      data: {
        wards: { id: number; province_id: number; name: string }[]
      }
    }>('/api/master-data', params)
    
    return (res.data?.wards || []).map(w => ({
      id: w.id,
      provinceId: w.province_id,
      name: w.name
    }))
  }
}

export const masterDataRepository: IMasterDataRepository = new MasterDataRepository()
