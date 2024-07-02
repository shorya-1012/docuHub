type Props = {
    styles: string
}

export default function DocuHubLogo({ styles }: Props) {
    return (
        <div className={`${styles} font-semibold flex w-full justify-center`}>
            <div className="h-max p-[1px] md:p-1">Docu</div>
            <div className="bg-orange-400 h-max p-[1px] md:p-1 rounded">Hub</div>
        </div>
    )
}
