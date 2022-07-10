import clsx from "clsx"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useClickAway } from "react-use"
import { useRecoilValue } from "recoil"
import { lastEpgUpdatedAtom } from "../../../atoms/contentPlayer"
import { useNow } from "../../../hooks/date"
import { ChannelType, Program, Service } from "../../../infra/mirakurun/api"
import { SidebarSelectedServiceList } from "./SidebarSelectedServiceList"

export const ControllerSidebar: React.FC<{
  isVisible: boolean
  services: Service[]
  setService: (service: Service) => unknown
  setIsSidebarOpen: (b: boolean) => unknown
}> = ({ isVisible, services, setService, setIsSidebarOpen }) => {
  const ref = useRef<HTMLDivElement>(null)
  useClickAway(ref, () => setIsSidebarOpen(false))
  const serviceTypes = useMemo(
    () =>
      Array.from(
        new Set(
          services.map((service) => service.channel?.type).filter((s) => s)
        )
      ),
    [services]
  )
  const [selectedType, setSelectedType] = useState<ChannelType | undefined>(
    serviceTypes?.[0]
  )
  const targetServices = useMemo(
    () =>
      Object.values(
        services
          .filter((service) => service.channel?.type === selectedType)
          .reduce((services: Record<string, Service[]>, service) => {
            const identifier =
              service.channel?.type === "CS"
                ? service.id
                : service.channel?.channel ?? service.id
            if (!identifier) {
              return services
            }
            if (!services[identifier]) {
              services[identifier] = [service]
            } else {
              services[identifier].push(service)
            }
            return services
          }, {})
      ).sort(
        (a, b) =>
          (a[0].remoteControlKeyId ?? a[0].serviceId) -
          (b[0].remoteControlKeyId ?? b[0].serviceId)
      ),
    [selectedType, services]
  )
  const now = useNow()
  const [queriedPrograms, setQueriedPrograms] = useState<Program[]>([])
  const lastEpgUpdated = useRecoilValue(lastEpgUpdatedAtom)
  useEffect(() => {
    const unix = now.unix() * 1000
    window.Preload.public.epgManager
      .query({
        startAtLessThan: unix,
        endAtMoreThan: unix + 1,
      })
      .then(async (currentPrograms) => {
        const filter = (program: Program) =>
          services.find(
            (service) =>
              service.serviceId === program.serviceId &&
              service.networkId === program.networkId
          )
        const filtered = currentPrograms.filter(filter).sort()
        const max = Math.max(
          ...filtered.map((program) => program.startAt + program.duration)
        )
        if (!max) {
          setQueriedPrograms((prev) =>
            JSON.stringify(prev) === JSON.stringify(filtered) ? prev : filtered
          )
          return
        }
        const programs = await window.Preload.public.epgManager.query({
          startAtLessThan: max,
          startAt: unix,
        })
        const queriedPrograms = [...programs.filter(filter), ...filtered].sort()
        setQueriedPrograms((prev) =>
          JSON.stringify(prev) === JSON.stringify(queriedPrograms)
            ? prev
            : queriedPrograms
        )
      })
  }, [now, lastEpgUpdated])
  return (
    <div
      ref={ref}
      className={clsx(
        "w-full",
        "h-full",
        "bg-gray-800 bg-opacity-30",
        "duration-150 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0",
        !isVisible && "cursor-none",
        "p-4",
        "flex",
        "flex-col"
      )}
      onWheel={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className={clsx("flex", "flex-col", "h-full")}>
        <div
          className={clsx(
            "overflow-auto",
            "flex",
            "pb-2",
            "shrink-0",
            "scrollbar-thin"
          )}
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY
          }}
        >
          {serviceTypes.map((type, idx) => (
            <button
              key={type}
              type="button"
              className={clsx(
                type === selectedType ? "bg-gray-600" : "bg-gray-800",
                "text-gray-100",
                idx === 0 && "rounded-l-md",
                idx === serviceTypes.length - 1 && "rounded-r-md",
                idx !== serviceTypes.length - 1 && "border-r border-gray-100",
                "px-3",
                "py-2",
                "bg-opacity-70"
              )}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <SidebarSelectedServiceList
          services={targetServices}
          queriedPrograms={queriedPrograms}
          setService={setService}
        />
      </div>
    </div>
  )
}
