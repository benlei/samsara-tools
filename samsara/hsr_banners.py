from samsara import banners, hsr_fandom


class BannersParser(banners.BannersParser):
    def __int__(self):
        super.__init__(self)
        # self.CategoryVersionPrefix = "Category:Released in Version "
        # self.CategoryFeaturedPrefix = "Category:Features "
        self.WeaponPagePrefix = r"(Brilliant.Fixation|Bygone.Reminiscence)"

    def fetch_page_content(self, page_id: int) -> str:
        return hsr_fandom.get_page_content(page_id)["query"]["pages"][0]["revisions"][
            0
        ]["slots"]["main"]["content"]
