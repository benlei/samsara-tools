from samsara import banners


class BannersParser(banners.BannersParser):
    def __int__(self):
        super.__init__(self)
        # self.CategoryVersionPrefix = "Category:Released in Version "
        # self.CategoryFeaturedPrefix = "Category:Features "
        self.WeaponPagePrefix = "Brilliant Fixation"
