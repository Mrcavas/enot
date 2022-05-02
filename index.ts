import {
  AdminOnly,
  ButtonRowComponent,
  CategoryChannel,
  CommandHandler,
  Description,
  IntentsFlags,
  Message,
  Name,
  NicordButton,
  NicordClient,
  NicordSlashCommand,
  NumberOption,
  SlashCommandBooleanOption,
  SlashCommandListener,
  StringOption,
  TextChannel
} from "nicord.js"

const { token } = require("./enot_token.json")
const client = new NicordClient([
  IntentsFlags.GUILDS,
  IntentsFlags.GUILD_MESSAGES
])
const currentLessonsId = "970211089650450483"
const pastLessonsId = "969562758339231755"
let currentLesson: {
  channel?: TextChannel
  msg?: Message
} = {}

client.setToken(token)
client.defaultGuild = "967069655015489578"
client.localSlashCommands()
client.debug()
client.start()

@AdminOnly
@SlashCommandListener
class SlashCommands {
  @CommandHandler
  @Name("lesson")
  @Description("Начать новое занятие")
  @StringOption({
    name: "начало",
    description: "Время начала занятия",
    required: true
  })
  @StringOption({
    name: "конец",
    description: "Время конца занятия",
    required: true
  })
  @StringOption({
    name: "дата",
    description: "Дата занятия",
    required: false
  })
  @StringOption({
    name: "место",
    description: "Место проведения занятия",
    required: false,
    choices: [
      ["очно", "очно"],
      ["дистант", "дистант"]
    ]
  })
  private async lesson(cmd: NicordSlashCommand) {
    const start = cmd.getOption<string>("начало") ?? ""
    const end = cmd.getOption<string>("конец") ?? ""
    const date = formatDate(cmd.getOption<string>("дата"))
    const place = cmd.getOption<string>("место") ?? "дистант"

    if (place === "дистант")
      currentLesson.channel = (await (
        await cmd.guild?.channels.create(formatForChannel(start, end, date), {})
      )?.setParent(currentLessonsId)) as TextChannel

    currentLesson.msg = await cmd.original.channel?.send({
      content: `${formatLesson(start, end, date, place)}`,
      components: [
        new ButtonRowComponent(
          new NicordButton("cancel", "Отменить", "DANGER"),
          new NicordButton("finish", "Закончить", "SUCCESS")
        )
      ]
    })
    await cmd.ephemeral("Готово!")
  }
}

client.addCommandListener(SlashCommands)
client.registerButton("cancel", (_) => lockLessonWithReason("отменено"))
client.registerButton("finish", (_) => lockLessonWithReason("закончено"))

const lockLessonWithReason = async (reason: string) => {
  currentLesson.msg?.edit({
    content: `*${currentLesson.msg.content} (${reason})*`,
    components: []
  })
  await currentLesson.channel?.setParent(pastLessonsId)
  currentLesson.channel?.lockPermissions()
  currentLesson = {}
}

const formatDate = (date?: string) => {
  if (date) return date
  const d = new Date()
  const day = d.getDay() + 1
  const month = d.getMonth() + 1
  return `${day < 10 ? "0" : ""}${day}.${
    month < 10 ? "0" : ""
  }${month}.${d.getFullYear()}`
}

const formatTime = (time: string) => time.replaceAll(":", "l")
const formatForChannel = (start: string, end: string, date: string) =>
  `${date.replaceAll(".", "_")}_${formatTime(start)}-${formatTime(end)}`
const formatLesson = (
  start: string,
  end: string,
  date: string,
  place: string
) => `${date}: ${start}-${end} ${place}`
